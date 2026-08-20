/**
 * Schema Sync — compares ontology-generated schema with the live Prisma schema
 * and can auto-fix divergences.
 */
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { parseOntology, type Ontology } from "@/lib/ontology-parser";
import { SchemaGenerator, type GeneratedSchema, type MigrationPlan } from "./schema-generator";

// ── Types ───────────────────────────────────────────────────────────────────

export interface SyncResult {
  inSync: boolean;
  ontologyClassCount: number;
  prismaModelCount: number;
  missingInPrisma: string[];
  extraInPrisma: string[];
  fieldDiffs: FieldDiff[];
  migration: MigrationPlan;
}

export interface FieldDiff {
  model: string;
  field: string;
  issue: "missing-in-prisma" | "extra-in-prisma" | "type-mismatch";
  ontologyType?: string;
  prismaType?: string;
}

export interface FixResult {
  applied: boolean;
  schemaPath: string;
  changes: string[];
  warnings: string[];
}

// ── Prisma schema parser (lightweight) ──────────────────────────────────────

interface ParsedPrismaModel {
  name: string;
  fields: Map<string, string>; // fieldName → "Type" or "Type?" etc.
}

function parsePrismaModels(schemaText: string): Map<string, ParsedPrismaModel> {
  const models = new Map<string, ParsedPrismaModel>();
  const modelRegex = /^model\s+(\w+)\s*\{([\s\S]*?)\}/gm;
  let match;

  while ((match = modelRegex.exec(schemaText)) !== null) {
    const name = match[1];
    const body = match[2];
    const fields = new Map<string, string>();

    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("}") || trimmed.startsWith("model")) continue;

      // Skip relation blocks and attributes
      if (trimmed.startsWith("@") || trimmed.startsWith("}")) continue;

      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const fieldName = parts[0];
        const fieldType = parts[1];
        fields.set(fieldName, fieldType);
      }
    }

    models.set(name, { name, fields });
  }

  return models;
}

// ── Sync Service ────────────────────────────────────────────────────────────

export class SchemaSyncService {
  private generator = new SchemaGenerator();

  /**
   * Compare ontology with current Prisma schema and report differences.
   */
  async syncSchema(ontology?: Ontology): Promise<SyncResult> {
    const ont = ontology ?? await parseOntology();
    const generatedSchema = this.generator.generateSchema(ont);

    // Read current prisma schema
    const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
    let prismaText: string;
    try {
      prismaText = await readFile(schemaPath, "utf-8");
    } catch {
      prismaText = "";
    }

    const prismaModels = parsePrismaModels(prismaText);
    const generatedModelNames = new Set(generatedSchema.models.map((m) => m.name));
    const prismaModelNames = new Set(prismaModels.keys());

    const missingInPrisma = generatedSchema.models
      .filter((m) => !prismaModelNames.has(m.name))
      .map((m) => m.name);

    const extraInPrisma = [...prismaModelNames].filter(
      (n) => !generatedModelNames.has(n) && !["Account", "Session", "VerificationToken", "User"].includes(n)
    );

    // Field-level diffs for models present in both
    const fieldDiffs: FieldDiff[] = [];
    for (const genModel of generatedSchema.models) {
      const prismaModel = prismaModels.get(genModel.name);
      if (!prismaModel) continue;

      for (const genField of genModel.fields) {
        if (genField.isId || genField.relation) continue; // Skip id and relation fields
        const prismaType = prismaModel.fields.get(genField.name);
        if (!prismaType) {
          fieldDiffs.push({
            model: genModel.name,
            field: genField.name,
            issue: "missing-in-prisma",
            ontologyType: genField.type,
          });
        }
      }

      // Extra fields in Prisma not in ontology (excluding standard fields)
      const standardFields = new Set(["id", "createdAt", "updatedAt", "organizationId", "universityId"]);
      for (const [fieldName] of prismaModel.fields) {
        if (standardFields.has(fieldName)) continue;
        if (!genModel.fields.some((f) => f.name === fieldName)) {
          fieldDiffs.push({
            model: genModel.name,
            field: fieldName,
            issue: "extra-in-prisma",
            prismaType: prismaModel.fields.get(fieldName),
          });
        }
      }
    }

    // Generate migration plan
    const migration = this.generator.generateMigration(ont);

    return {
      inSync: missingInPrisma.length === 0 && fieldDiffs.filter((d) => d.issue === "missing-in-prisma").length === 0,
      ontologyClassCount: ont.classes.length,
      prismaModelCount: prismaModels.size,
      missingInPrisma,
      extraInPrisma,
      fieldDiffs,
      migration,
    };
  }

  /**
   * Auto-generate a migration schema and write it to disk.
   */
  async autoFix(ontology?: Ontology): Promise<FixResult> {
    const ont = ontology ?? await parseOntology();
    const prismaText = this.generator.generatePrismaSchema(ont);
    const schemaPath = join(process.cwd(), "prisma", "schema.generated.prisma");
    const changes: string[] = [];
    const warnings: string[] = [];

    try {
      // Backup existing generated schema
      const existing = await readFile(schemaPath, "utf-8").catch(() => null);
      if (existing) {
        const backupPath = join(
          process.cwd(),
          "prisma",
          `schema.generated.prisma.bak.${Date.now()}`
        );
        await writeFile(backupPath, existing, "utf-8");
        changes.push(`Backed up existing schema to ${backupPath}`);
      }
    } catch {
      // First generation — no backup needed
    }

    await writeFile(schemaPath, prismaText, "utf-8");
    changes.push(`Generated schema written to ${schemaPath}`);

    // Also produce a migration plan
    const syncResult = await this.syncSchema(ont);
    if (syncResult.missingInPrisma.length > 0) {
      warnings.push(
        `${syncResult.missingInPrisma.length} models in ontology are missing from the main schema.prisma`
      );
    }

    return {
      applied: true,
      schemaPath,
      changes,
      warnings,
    };
  }

  /**
   * Watch for ontology changes and trigger regeneration.
   * Returns a cleanup function.
   */
  watchForChanges(onChange: (schema: string) => void): () => void {
    // Use a simple polling approach since chokidar isn't available
    let lastContent = "";
    let running = true;

    const check = async () => {
      if (!running) return;
      try {
        const ontologyDir = join(process.cwd(), "ontology");
        const { readdir } = await import("fs/promises");
        const files = await readdir(ontologyDir);
        const contentHash = files.filter((f) => f.endsWith(".ttl")).sort().join(",");

        if (contentHash !== lastContent) {
          lastContent = contentHash;
          const ontology = await parseOntology();
          const schema = this.generator.generatePrismaSchema(ontology);
          onChange(schema);
        }
      } catch {
        // Ontology files may not exist yet
      }
      if (running) setTimeout(check, 5000);
    };

    check();
    return () => { running = false; };
  }
}

// Singleton
let _instance: SchemaSyncService | null = null;
export function getSchemaSyncService(): SchemaSyncService {
  if (!_instance) _instance = new SchemaSyncService();
  return _instance;
}
