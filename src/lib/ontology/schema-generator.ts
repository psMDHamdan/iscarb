/**
 * Ontology → Prisma Schema Generator
 * Converts ontology classes and properties into PostgreSQL schemas via Prisma.
 *
 * Accepts both `Ontology` (from ontology-parser) and `OntologyEngine` (from engine.ts).
 */
import type {
  Ontology,
  OntologyClass,
  OntologyProperty,
} from "@/lib/ontology-parser";
import type {
  OntologyEngine as OntologyEngineInstance,
  ObjectProperty,
  DatatypeProperty,
} from "@/lib/ontology/engine";

// ── Types ───────────────────────────────────────────────────────────────────

export interface GeneratedSchema {
  models: GeneratedModel[];
  relations: GeneratedRelation[];
  indexes: GeneratedIndex[];
  enums: GeneratedEnum[];
  warnings: string[];
}

export interface GeneratedModel {
  name: string;
  fields: GeneratedField[];
  tableName: string;
  description: string;
}

export interface GeneratedField {
  name: string;
  type: string;
  required: boolean;
  isList: boolean;
  isId: boolean;
  default?: string;
  relation?: { model: string; fields: string[]; references: string[] };
  unique?: boolean;
  index?: boolean;
  dbType?: string;
}

export interface GeneratedRelation {
  name: string;
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  foreignKey?: string;
}

export interface GeneratedIndex {
  model: string;
  fields: string[];
  isUnique: boolean;
  name?: string;
}

export interface GeneratedEnum {
  name: string;
  values: string[];
}

export interface MigrationPlan {
  creates: string[];
  alters: string[];
  drops: string[];
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ── XSD → Prisma type mapping ──────────────────────────────────────────────

const XSD_TO_PRISMA: Record<string, { type: string; dbType?: string }> = {
  string:   { type: "String" },
  int:      { type: "Int" },
  integer:  { type: "Int" },
  decimal:  { type: "Float" },
  float:    { type: "Float" },
  double:   { type: "Float" },
  boolean:  { type: "Boolean" },
  date:     { type: "DateTime" },
  dateTime: { type: "DateTime" },
  // aliases the ontology parser may produce
  text:     { type: "String", dbType: "Text" },
  json:     { type: "Json" },
};

function mapXsdType(xsd: string): { type: string; dbType?: string } {
  const bare = xsd.replace(/^xsd:/, "").toLowerCase();
  return XSD_TO_PRISMA[bare] ?? { type: "String" };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pascalCase(s: string): string {
  return s
    .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

function camelCase(s: string): string {
  const p = pascalCase(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function pluralize(s: string): string {
  if (s.endsWith("y") && !/[aeiou]y$/.test(s)) return s.slice(0, -1) + "ies";
  if (s.endsWith("s") || s.endsWith("x") || s.endsWith("z") || s.endsWith("ch") || s.endsWith("sh"))
    return s + "es";
  return s + "s";
}

function buildInheritanceMap(classes: OntologyClass[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const cls of classes) {
    if (cls.parentClass) {
      if (!map.has(cls.parentClass)) map.set(cls.parentClass, []);
      map.get(cls.parentClass)!.push(cls.id);
    }
  }
  return map;
}

/** Walk up the parent chain to collect all ancestors of a class. */
function ancestors(cls: OntologyClass, classMap: Map<string, OntologyClass>): string[] {
  const result: string[] = [];
  let current = cls.parentClass;
  while (current) {
    result.push(current);
    const parent = classMap.get(current);
    current = parent?.parentClass;
  }
  return result;
}

// ── OntologyEngine adapter ──────────────────────────────────────────────────

/** Type guard: check if a value is an `OntologyEngine` instance. */
function isOntologyEngine(value: any): value is OntologyEngineInstance {
  return value instanceof Object && "classes" in value && value.classes instanceof Map && "objectProperties" in value;
}

/**
 * Convert an `OntologyEngine` instance into the flat `Ontology` format
 * expected by the rest of this module.
 */
export function ontologyEngineToOntology(engine: OntologyEngineInstance): Ontology {
  const classes: OntologyClass[] = Array.from(engine.classes.values()).map((c) => ({
    id: c.id,
    label: c.label,
    labelAr: c.annotations?.labelAr,
    comment: c.description,
    parentClass: c.parentClass,
    equivalentClass: c.equivalentClasses?.[0],
    sourceFile: "engine",
  }));

  const properties: OntologyProperty[] = [];

  for (const [id, prop] of engine.objectProperties) {
    properties.push({
      id,
      label: prop.name,
      type: "ObjectProperty",
      domain: prop.domain,
      range: prop.range,
      comment: undefined,
      sourceFile: "engine",
    });
  }

  for (const [id, prop] of engine.datatypeProperties) {
    properties.push({
      id,
      label: prop.name,
      type: "DatatypeProperty",
      domain: prop.domain,
      range: `xsd:${prop.datatype}`,
      comment: undefined,
      sourceFile: "engine",
    });
  }

  return { classes, properties, prefixes: Object.fromEntries(engine.namespaces) };
}

// ── Schema Generator ────────────────────────────────────────────────────────

export class SchemaGenerator {
  /**
   * Generate a full schema description from an ontology.
   * Accepts either `Ontology` (from parser) or `OntologyEngine` (from engine.ts).
   */
  generateSchema(ontology: Ontology | OntologyEngineInstance): GeneratedSchema {
    const ont = isOntologyEngine(ontology) ? ontologyEngineToOntology(ontology) : ontology;
    const warnings: string[] = [];
    const classMap = new Map(ont.classes.map((c) => [c.id, c]));
    const childMap = buildInheritanceMap(ont.classes);

    // Group properties by domain
    const propsByDomain = new Map<string, OntologyProperty[]>();
    for (const prop of ont.properties) {
      if (!propsByDomain.has(prop.domain)) propsByDomain.set(prop.domain, []);
      propsByDomain.get(prop.domain)!.push(prop);
    }

    const models: GeneratedModel[] = [];
    const relations: GeneratedRelation[] = [];
    const indexes: GeneratedIndex[] = [];
    const enums: GeneratedEnum[] = [];
    const enumSet = new Set<string>();

    for (const cls of ont.classes) {
      const modelName = pascalCase(cls.id);
      const fields: GeneratedField[] = [];

      // ── id ──
      fields.push({
        name: "id",
        type: "String",
        required: true,
        isList: false,
        isId: true,
        default: "cuid()",
      });

      // ── inherited datatype fields ──
      const ancestorIds = ancestors(cls, classMap);
      const inheritedProps: OntologyProperty[] = [];
      for (const aid of ancestorIds) {
        const aProps = propsByDomain.get(aid) || [];
        inheritedProps.push(...aProps);
      }
      const ownProps = propsByDomain.get(cls.id) || [];
      const allDatatypeProps = [...ownProps.filter((p) => p.type === "DatatypeProperty")];

      // Also pull inherited datatype properties
      for (const aid of ancestorIds) {
        const aProps = (propsByDomain.get(aid) || []).filter(
          (p) => p.type === "DatatypeProperty"
        );
        allDatatypeProps.push(...aProps);
      }

      const seenFields = new Set<string>(["id"]);
      for (const prop of allDatatypeProps) {
        const fname = camelCase(prop.label);
        if (seenFields.has(fname)) continue;
        seenFields.add(fname);
        const { type, dbType } = mapXsdType(prop.range);
        fields.push({
          name: fname,
          type,
          required: true,
          isList: false,
          isId: false,
          dbType,
        });
      }

      // ── status field (default for all entities) ──
      if (!seenFields.has("status")) {
        fields.push({
          name: "status",
          type: "String",
          required: false,
          isList: false,
          isId: false,
          default: '"active"',
        });
        seenFields.add("status");
      }

      // ── foreign keys from object properties (domain = this class) ──
      const objProps = ownProps.filter((p) => p.type === "ObjectProperty");
      for (const prop of objProps) {
        const targetClass = prop.range;
        if (!targetClass) {
          warnings.push(`Property "${prop.id}" has no range (target class).`);
          continue;
        }
        // Skip self-referential or Entity→Entity wildcard relations
        if (targetClass === "Entity" && cls.id === "Entity") continue;

        const targetName = pascalCase(targetClass);
        const fkField = camelCase(prop.label) + "Id";
        if (!seenFields.has(fkField)) {
          seenFields.add(fkField);
          fields.push({
            name: fkField,
            type: "String",
            required: false,
            isList: false,
            isId: false,
            relation: {
              model: targetName,
              fields: [fkField],
              references: ["id"],
            },
          });
          relations.push({
            name: camelCase(prop.label),
            from: modelName,
            to: targetName,
            type: "one-to-many",
            foreignKey: fkField,
          });
          indexes.push({
            model: modelName,
            fields: [fkField],
            isUnique: false,
          });
        }
      }

      // ── createdAt / updatedAt ──
      if (!seenFields.has("createdAt")) {
        fields.push({
          name: "createdAt",
          type: "DateTime",
          required: true,
          isList: false,
          isId: false,
          default: "now()",
        });
      }
      if (!seenFields.has("updatedAt")) {
        fields.push({
          name: "updatedAt",
          type: "DateTime",
          required: true,
          isList: false,
          isId: false,
          default: "now()",
          dbType: "@updatedAt",
        });
      }

      models.push({
        name: modelName,
        fields,
        tableName: pluralize(cls.id.toLowerCase()),
        description: cls.comment || cls.label,
      });
    }

    return { models, relations, indexes, enums, warnings };
  }

  /**
   * Emit a complete Prisma schema text.
   */
  generatePrismaSchema(ontology: Ontology | OntologyEngineInstance): string {
    const schema = this.generateSchema(ontology);
    return this.toPrismaText(schema);
  }

  /**
   * Diff two ontology versions and produce a migration plan.
   */
  generateMigration(
    current: Ontology | OntologyEngineInstance,
    previous?: Ontology | OntologyEngineInstance
  ): MigrationPlan {
    const creates: string[] = [];
    const alters: string[] = [];
    const drops: string[] = [];
    const warnings: string[] = [];

    if (!previous) {
      // No previous — generate create-all statements
      const prevSchema = this.generateSchema({ classes: [], properties: [], prefixes: {} });
      const currSchema = this.generateSchema(current);

      for (const model of currSchema.models) {
        creates.push(`CREATE TABLE "${model.tableName}" (${model.fields.map((f) => {
          let col = `  "${f.name}" ${f.type}`;
          if (f.isId) col = `  "id" String @id @default(cuid())`;
          if (f.dbType && f.dbType !== "@updatedAt") col += ` @db.${f.dbType}`;
          if (f.dbType === "@updatedAt") col += " @updatedAt";
          if (f.default && !f.isId) col += ` @default(${f.default})`;
          if (!f.required && !f.isId) col += "?";
          return col;
        }).join(",\n")});`);
      }
      return { creates, alters, drops, warnings };
    }

    const prevModels = new Map(this.generateSchema(previous).models.map((m) => [m.name, m]));
    const currModels = new Map(this.generateSchema(current).models.map((m) => [m.name, m]));

    // Creates: models in current but not in previous
    for (const [name, model] of currModels) {
      if (!prevModels.has(name)) {
        creates.push(`-- CREATE TABLE "${model.tableName}"`);
      }
    }

    // Drops: models in previous but not in current
    for (const [name, model] of prevModels) {
      if (!currModels.has(name)) {
        drops.push(`-- DROP TABLE "${model.tableName}"`);
      }
    }

    // Alters: models present in both — diff fields
    for (const [name, currModel] of currModels) {
      const prevModel = prevModels.get(name);
      if (!prevModel) continue;

      const prevFieldMap = new Map(prevModel.fields.map((f) => [f.name, f]));
      const currFieldMap = new Map(currModel.fields.map((f) => [f.name, f]));

      // Added fields
      for (const [fname, f] of currFieldMap) {
        if (!prevFieldMap.has(fname)) {
          alters.push(`ALTER TABLE "${currModel.tableName}" ADD COLUMN "${fname}" ${f.type}${f.required ? "" : "?"};`);
        }
      }

      // Removed fields
      for (const [fname] of prevFieldMap) {
        if (!currFieldMap.has(fname)) {
          alters.push(`ALTER TABLE "${currModel.tableName}" DROP COLUMN "${fname}";`);
        }
      }

      // Changed types
      for (const [fname, currF] of currFieldMap) {
        const prevF = prevFieldMap.get(fname);
        if (prevF && prevF.type !== currF.type) {
          alters.push(`-- TYPE CHANGE "${currModel.tableName}"."${fname}": ${prevF.type} → ${currF.type}`);
          warnings.push(`Column "${fname}" on "${currModel.tableName}" changed type — manual review needed.`);
        }
      }
    }

    return { creates, alters, drops, warnings };
  }

  /**
   * Validate an ontology for schema-generation issues.
   */
  validateSchema(ontology: Ontology | OntologyEngineInstance): ValidationResult {
    const ont = isOntologyEngine(ontology) ? ontologyEngineToOntology(ontology) : ontology;
    const errors: string[] = [];
    const warnings: string[] = [];
    const classIds = new Set(ont.classes.map((c) => c.id));

    // Circular parent references
    for (const cls of ont.classes) {
      const visited = new Set<string>();
      let current: string | undefined = cls.parentClass;
      while (current) {
        if (visited.has(current)) {
          errors.push(`Circular parent reference detected: "${cls.id}" → "${current}"`);
          break;
        }
        visited.add(current);
        const parent = ont.classes.find((c) => c.id === current);
        current = parent?.parentClass;
      }
    }

    // Missing domain / range references
    for (const prop of ont.properties) {
      if (!classIds.has(prop.domain)) {
        errors.push(`Property "${prop.id}" references unknown domain class "${prop.domain}".`);
      }
      if (prop.type === "ObjectProperty" && !classIds.has(prop.range)) {
        errors.push(`Property "${prop.id}" references unknown range class "${prop.range}".`);
      }
    }

    // Duplicate class names
    const nameCounts = new Map<string, number>();
    for (const cls of ont.classes) {
      nameCounts.set(cls.id, (nameCounts.get(cls.id) || 0) + 1);
    }
    for (const [name, count] of nameCounts) {
      if (count > 1) errors.push(`Duplicate class "${name}" found ${count} times.`);
    }

    // Warnings for unused classes (no properties point to/from them)
    const usedClasses = new Set<string>();
    for (const prop of ont.properties) {
      usedClasses.add(prop.domain);
      if (prop.type === "ObjectProperty") usedClasses.add(prop.range);
    }
    for (const cls of ont.classes) {
      if (!usedClasses.has(cls.id) && cls.id !== "Entity") {
        warnings.push(`Class "${cls.id}" has no properties — will generate an empty model.`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private toPrismaText(schema: GeneratedSchema): string {
    const lines: string[] = [];

    lines.push("// Auto-generated from iSCARB ontology — do not edit manually.");
    lines.push("// Run the schema generator via /api/v1/ontology/schema");
    lines.push("");
    lines.push("generator client {");
    lines.push('  provider = "prisma-client-js"');
    lines.push("}");
    lines.push("");
    lines.push("datasource db {");
    lines.push('  provider = "postgresql"');
    lines.push('  url      = env("DATABASE_URL")');
    lines.push("}");
    lines.push("");

    for (const model of schema.models) {
      if (model.description) {
        lines.push(`/// ${model.description}`);
      }
      lines.push(`model ${model.name} {`);
      for (const field of model.fields) {
        const parts: string[] = [`  ${field.name}`];

        if (field.isId) {
          parts.push("String");
          parts.push("@id");
          parts.push("@default(cuid())");
        } else {
          let type = field.type;
          if (field.dbType && field.dbType !== "@updatedAt") {
            type += ` @db.${field.dbType}`;
          }
          if (field.dbType === "@updatedAt") {
            type += " @updatedAt";
          }
          parts.push(type);

          if (field.isList) parts.push("[]");
          if (!field.required && !field.isId) parts.push("?");

          if (field.relation) {
            parts.push(`@relation("${field.relation.model}", fields: [${field.relation.fields.join(", ")}], references: [${field.relation.references.join(", ")}])`);
          }
          if (field.unique) parts.push("@unique");
          if (field.default) parts.push(`@default(${field.default})`);
        }

        lines.push(parts.join(" "));
      }
      lines.push("}");
      lines.push("");
    }

    // Warnings as comments
    for (const w of schema.warnings) {
      lines.push(`// WARNING: ${w}`);
    }

    return lines.join("\n");
  }
}
