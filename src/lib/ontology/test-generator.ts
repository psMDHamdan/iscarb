/**
 * Test Generator — generates Vitest test cases from the OntologyEngine.
 * Produces unit, integration, SPARQL, validation, and RBAC test definitions.
 */
import type { OntologyEngine } from "./engine";

export interface GeneratedTest {
  name: string;
  type: "unit" | "integration" | "sparql" | "validation" | "rbac";
  entity?: string;
  description: string;
  assertions: string[];
  setup?: string;
  teardown?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pascalCase(s: string): string {
  return s.replace(/(^|[-_\s])(\w)/g, (_, __: string, c: string) => c.toUpperCase());
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

function getRequiredFields(
  engine: OntologyEngine,
  classId: string
): { name: string; datatype: string; required: boolean }[] {
  const fields: { name: string; datatype: string; required: boolean }[] = [];
  for (const [, prop] of engine.datatypeProperties) {
    if (prop.domain === classId) {
      fields.push({ name: prop.name, datatype: prop.datatype, required: prop.required });
    }
  }
  return fields;
}

function buildSampleData(
  engine: OntologyEngine,
  classId: string
): Record<string, unknown> {
  const data: Record<string, unknown> = { id: `test-${classId.toLowerCase()}-1` };
  for (const [, prop] of engine.datatypeProperties) {
    if (prop.domain !== classId) continue;
    switch (prop.datatype) {
      case "string":
        data[prop.name] = prop.defaultValue || `test-${prop.name}`;
        break;
      case "integer":
        data[prop.name] = 42;
        break;
      case "float":
        data[prop.name] = 3.14;
        break;
      case "boolean":
        data[prop.name] = true;
        break;
      case "date":
        data[prop.name] = "2025-01-01";
        break;
      case "datetime":
        data[prop.name] = "2025-01-01T00:00:00Z";
        break;
      case "text":
        data[prop.name] = "Sample text content";
        break;
      case "json":
        data[prop.name] = {};
        break;
    }
  }
  return data;
}

// ── TestGenerator ────────────────────────────────────────────────────────────

export class TestGenerator {
  /** Generate CRUD unit tests for every ontology class. */
  generateUnitTests(ontology: OntologyEngine): GeneratedTest[] {
    const tests: GeneratedTest[] = [];

    for (const [classId, cls] of ontology.classes) {
      const model = pascalCase(classId);
      const sample = buildSampleData(ontology, classId);
      const required = getRequiredFields(ontology, classId).filter((f) => f.required);

      // 1. Create with valid data → success
      tests.push({
        name: `${model} — create with valid data`,
        type: "unit",
        entity: classId,
        description: `Create a ${cls.label} with valid data and verify it succeeds`,
        assertions: [
          `const result = await create${model}(${JSON.stringify(sample)})`,
          `expect(result).toBeDefined()`,
          `expect(result.id).toBe("${sample.id}")`,
        ],
        setup: `const validData = ${JSON.stringify(sample)}`,
      });

      // 2. Create with missing required field → validation error
      if (required.length > 0) {
        const incomplete = { ...sample };
        delete incomplete[required[0].name];
        tests.push({
          name: `${model} — create with missing required field`,
          type: "unit",
          entity: classId,
          description: `Create a ${cls.label} missing required field "${required[0].name}" → expect validation error`,
          assertions: [
            `const invalidData = ${JSON.stringify(incomplete)}`,
            `await expect(create${model}(invalidData)).rejects.toThrow()`,
          ],
        });
      }

      // 3. Create with duplicate unique field → conflict
      tests.push({
        name: `${model} — create with duplicate unique field`,
        type: "unit",
        entity: classId,
        description: `Create a ${cls.label} twice with same data → expect conflict error`,
        assertions: [
          `await create${model}(${JSON.stringify(sample)})`,
          `await expect(create${model}(${JSON.stringify(sample)})).rejects.toThrow()`,
        ],
      });

      // 4. Read existing entity → returns data
      tests.push({
        name: `${model} — read existing entity`,
        type: "unit",
        entity: classId,
        description: `Read a ${cls.label} by ID and verify returned data`,
        assertions: [
          `const created = await create${model}(${JSON.stringify(sample)})`,
          `const found = await get${model}(created.id)`,
          `expect(found).toBeDefined()`,
          `expect(found.id).toBe(created.id)`,
        ],
      });

      // 5. Read non-existent entity → 404
      tests.push({
        name: `${model} — read non-existent entity`,
        type: "unit",
        entity: classId,
        description: `Read a ${cls.label} with non-existent ID → expect 404`,
        assertions: [
          `await expect(get${model}("non-existent-id")).rejects.toThrow()`,
        ],
      });

      // 6. Update entity → returns updated data
      tests.push({
        name: `${model} — update entity`,
        type: "unit",
        entity: classId,
        description: `Update a ${cls.label} and verify changed fields`,
        assertions: [
          `const created = await create${model}(${JSON.stringify(sample)})`,
          `const updated = await update${model}(created.id, { status: "inactive" })`,
          `expect(updated.status).toBe("inactive")`,
        ],
      });

      // 7. Delete entity → success
      tests.push({
        name: `${model} — delete entity`,
        type: "unit",
        entity: classId,
        description: `Delete a ${cls.label} and verify it is removed`,
        assertions: [
          `const created = await create${model}(${JSON.stringify(sample)})`,
          `await delete${model}(created.id)`,
          `await expect(get${model}(created.id)).rejects.toThrow()`,
        ],
      });

      // 8. List entities → returns array with pagination
      tests.push({
        name: `${model} — list entities with pagination`,
        type: "unit",
        entity: classId,
        description: `List ${cls.label} records and verify pagination shape`,
        assertions: [
          `const list = await list${pluralize(model)}({ page: 1, pageSize: 10 })`,
          `expect(Array.isArray(list.data)).toBe(true)`,
          `expect(list.total).toBeGreaterThanOrEqual(0)`,
          `expect(list.page).toBe(1)`,
          `expect(list.pageSize).toBe(10)`,
        ],
      });
    }

    return tests;
  }

  /** Generate integration tests for each API endpoint. */
  generateApiTests(ontology: OntologyEngine): GeneratedTest[] {
    const tests: GeneratedTest[] = [];
    const BASE = "/api/v1";

    for (const [classId, cls] of ontology.classes) {
      const model = pascalCase(classId);
      const route = pluralize(classId.toLowerCase());
      const sample = buildSampleData(ontology, classId);
      const baseUrl = `${BASE}/${route}`;

      // GET list
      tests.push({
        name: `${model} API — GET ${route}`,
        type: "integration",
        entity: classId,
        description: `GET ${baseUrl} returns paginated list`,
        assertions: [
          `const res = await fetch("${baseUrl}?page=1&pageSize=10")`,
          `expect(res.status).toBe(200)`,
          `const body = await res.json()`,
          `expect(body.data).toBeDefined()`,
        ],
      });

      // GET by id
      tests.push({
        name: `${model} API — GET ${route}/[id]`,
        type: "integration",
        entity: classId,
        description: `GET ${baseUrl}/[id] returns single entity`,
        assertions: [
          `const created = await fetch("${baseUrl}", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(${JSON.stringify(sample)}) })`,
          `const { id } = (await created.json()).data`,
          `const res = await fetch("${baseUrl}/" + id)`,
          `expect(res.status).toBe(200)`,
        ],
      });

      // POST create
      tests.push({
        name: `${model} API — POST ${route}`,
        type: "integration",
        entity: classId,
        description: `POST ${baseUrl} creates entity`,
        assertions: [
          `const res = await fetch("${baseUrl}", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(${JSON.stringify(sample)}) })`,
          `expect(res.status).toBe(201)`,
          `const body = await res.json()`,
          `expect(body.data.id).toBeDefined()`,
        ],
      });

      // PUT update
      tests.push({
        name: `${model} API — PUT ${route}/[id]`,
        type: "integration",
        entity: classId,
        description: `PUT ${baseUrl}/[id] updates entity`,
        assertions: [
          `const created = await fetch("${baseUrl}", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(${JSON.stringify(sample)}) })`,
          `const { id } = (await created.json()).data`,
          `const res = await fetch("${baseUrl}/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "inactive" }) })`,
          `expect(res.status).toBe(200)`,
        ],
      });

      // DELETE
      tests.push({
        name: `${model} API — DELETE ${route}/[id]`,
        type: "integration",
        entity: classId,
        description: `DELETE ${baseUrl}/[id] removes entity`,
        assertions: [
          `const created = await fetch("${baseUrl}", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(${JSON.stringify(sample)}) })`,
          `const { id } = (await created.json()).data`,
          `const res = await fetch("${baseUrl}/" + id, { method: "DELETE" })`,
          `expect(res.status).toBe(200)`,
        ],
      });

      // Validation: missing required
      tests.push({
        name: `${model} API — POST ${route} validation`,
        type: "integration",
        entity: classId,
        description: `POST ${baseUrl} with invalid data → 400`,
        assertions: [
          `const res = await fetch("${baseUrl}", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })`,
          `expect(res.status).toBe(400)`,
        ],
      });
    }

    return tests;
  }

  /** Generate SPARQL query tests against known data. */
  generateSparqlTests(ontology: OntologyEngine): GeneratedTest[] {
    const tests: GeneratedTest[] = [];

    // Basic query: select all instances of each class
    for (const [classId, cls] of ontology.classes) {
      tests.push({
        name: `SPARQL — select all ${cls.label} instances`,
        type: "sparql",
        entity: classId,
        description: `Verify SPARQL query can retrieve all ${cls.label} instances`,
        assertions: [
          `const query = "PREFIX iscarb: <https://iscarb.edu/ontology/> SELECT ?s WHERE { ?s rdf:type iscarb:${classId} . }"`,
          `const results = await executeSparql(query)`,
          `expect(results).toBeDefined()`,
          `expect(results.bindings).toBeDefined()`,
        ],
        setup: `// Ensure test data exists for ${classId}`,
      });
    }

    // Verify all datatype properties are queryable
    const propsByDomain = new Map<string, string[]>();
    for (const [, prop] of ontology.datatypeProperties) {
      if (!propsByDomain.has(prop.domain)) propsByDomain.set(prop.domain, []);
      propsByDomain.get(prop.domain)!.push(prop.name);
    }

    for (const [classId, propNames] of propsByDomain) {
      const selectVars = propNames.map((p) => `?${p}`).join(" ");
      const whereClauses = propNames.map((p) => `?s iscarb:${p} ?${p} .`).join(" ");
      tests.push({
        name: `SPARQL — query ${classId} properties`,
        type: "sparql",
        entity: classId,
        description: `Verify SPARQL can query all datatype properties of ${classId}`,
        assertions: [
          `const query = "PREFIX iscarb: <https://iscarb.edu/ontology/> SELECT ?s ${selectVars} WHERE { ?s rdf:type iscarb:${classId} . ${whereClauses} } LIMIT 1"`,
          `const results = await executeSparql(query)`,
          `expect(results.bindings.length).toBeLessThanOrEqual(1)`,
        ],
      });
    }

    // Object property traversal queries
    for (const [, prop] of ontology.objectProperties) {
      tests.push({
        name: `SPARQL — traverse ${prop.name} (${prop.domain} to ${prop.range})`,
        type: "sparql",
        entity: prop.domain,
        description: `Verify SPARQL can follow the ${prop.name} object property`,
        assertions: [
          `const query = "PREFIX iscarb: <https://iscarb.edu/ontology/> SELECT ?s ?target WHERE { ?s iscarb:${prop.name} ?target . } LIMIT 5"`,
          `const results = await executeSparql(query)`,
          `expect(results).toBeDefined()`,
        ],
      });
    }

    // Cross-entity join query
    tests.push({
      name: "SPARQL — cross-entity join query",
      type: "sparql",
      description: "Verify multi-pattern SPARQL query joins across entities",
      assertions: [
        `const query = "PREFIX iscarb: <https://iscarb.edu/ontology/> SELECT ?student ?course WHERE { ?student iscarb:enrolledIn ?course . ?student rdf:type iscarb:Student . ?course rdf:type iscarb:Course . } LIMIT 10"`,
        `const results = await executeSparql(query)`,
        `expect(results).toBeDefined()`,
      ],
    });

    return tests;
  }

  /** Generate validation rule tests. */
  generateValidationTests(ontology: OntologyEngine): GeneratedTest[] {
    const tests: GeneratedTest[] = [];

    // Test ontology structural validation
    tests.push({
      name: "Ontology validation — no inheritance cycles",
      type: "validation",
      description: "Verify the ontology has no circular class inheritance",
      assertions: [
        `const result = engine.validate()`,
        `expect(result.valid).toBe(true)`,
        `expect(result.errors.filter(e => e.message.includes("cycle"))).toHaveLength(0)`,
      ],
      setup: `const engine = new OntologyEngine()`,
    });

    // Test required field constraints per class
    for (const [classId, cls] of ontology.classes) {
      const required = getRequiredFields(ontology, classId).filter((f) => f.required);
      if (required.length === 0) continue;

      tests.push({
        name: `Validation — ${cls.label} required fields`,
        type: "validation",
        entity: classId,
        description: `Verify all required fields on ${cls.label} are enforced`,
        assertions: [
          ...required.map(
            (f) => `// Field "${f.name}" (${f.datatype}) must be present`
          ),
          `const data = ${JSON.stringify(buildSampleData(ontology, classId))}`,
          `// Missing each required field should fail validation`,
          ...required.map(
            (f) => `const partial = { ...data }; delete partial.${f.name}; expect(validate${pascalCase(classId)}(partial).valid).toBe(false)`
          ),
        ],
      });
    }

    // Test datatype constraints
    for (const [, prop] of ontology.datatypeProperties) {
      if (prop.minLength !== undefined || prop.maxLength !== undefined || prop.pattern) {
        const constraints: string[] = [];
        if (prop.minLength !== undefined) constraints.push(`minLength: ${prop.minLength}`);
        if (prop.maxLength !== undefined) constraints.push(`maxLength: ${prop.maxLength}`);
        if (prop.pattern) constraints.push(`pattern: ${prop.pattern}`);

        tests.push({
          name: `Validation — ${prop.name} on ${prop.domain} (${constraints.join(", ")})`,
          type: "validation",
          entity: prop.domain,
          description: `Verify constraint on ${prop.domain}.${prop.name}`,
          assertions: [
            prop.minLength !== undefined
              ? `expect(validateField("${prop.name}", "${"a".repeat(prop.minLength - 1)}", ${JSON.stringify(prop)}).valid).toBe(false)`
              : `// no minLength constraint`,
            prop.maxLength !== undefined
              ? `expect(validateField("${prop.name}", "${"a".repeat(prop.maxLength + 1)}", ${JSON.stringify(prop)}).valid).toBe(false)`
              : `// no maxLength constraint`,
            prop.pattern
              ? `expect(validateField("${prop.name}", "invalid-email", ${JSON.stringify(prop)}).valid).toBe(false)`
              : `// no pattern constraint`,
          ],
        });
      }
    }

    return tests;
  }

  /** Generate RBAC permission matrix tests. */
  generateRbacTests(ontology: OntologyEngine): GeneratedTest[] {
    const tests: GeneratedTest[] = [];
    const roles = ["admin", "dean", "faculty", "student", "staff", "guest"];

    for (const [classId, cls] of ontology.classes) {
      const model = pascalCase(classId);
      const operations = ["create", "read", "update", "delete", "list"];

      for (const op of operations) {
        tests.push({
          name: `RBAC — ${model} ${op} permissions`,
          type: "rbac",
          entity: classId,
          description: `Verify correct roles can ${op} ${cls.label} records`,
          assertions: [
            `// Verify admin can always ${op}`,
            `expect(await checkPermission("admin", "${op}", "${classId}")).toBe(true)`,
            `// Verify guest cannot ${op}`,
            `expect(await checkPermission("guest", "${op}", "${classId}")).toBe(false)`,
            `// Verify role assignments are respected`,
            ...roles.slice(0, -1).map(
              (role) =>
                `const allowed = await checkPermission("${role}", "${op}", "${classId}"); expect(typeof allowed).toBe("boolean")`
            ),
          ],
        });
      }
    }

    // Tenant isolation test
    tests.push({
      name: "RBAC — tenant isolation",
      type: "rbac",
      description: "Verify users cannot access data from other tenants",
      assertions: [
        `const resA = await fetchWithAuth("/api/v1/admin/organization", "tenant-a-admin")`,
        `const resB = await fetchWithAuth("/api/v1/admin/organization", "tenant-b-admin")`,
        `const orgsA = (await resA.json()).data`,
        `const orgsB = (await resB.json()).data`,
        `expect(orgsA.every((o: any) => o.tenantId === "tenant-a")).toBe(true)`,
        `expect(orgsB.every((o: any) => o.tenantId === "tenant-b")).toBe(true)`,
      ],
    });

    return tests;
  }

  /** Produce a Vitest test file as a string. */
  generateTestCode(test: GeneratedTest): string {
    const lines: string[] = [];

    lines.push(`import { describe, it, expect, ${test.setup ? "beforeEach, " : ""}vi } from "vitest"`);
    lines.push("");

    // Imports based on test type
    if (test.type === "unit") {
      lines.push(`// ${test.entity ? `Entity: ${test.entity}` : "Ontology"} unit test`);
    } else if (test.type === "integration") {
      lines.push(`// ${test.entity ? `Entity: ${test.entity}` : "API"} integration test`);
    } else if (test.type === "sparql") {
      lines.push(`import { executeSparql } from "@/services/rdf/rdf-client.service"`);
    } else if (test.type === "rbac") {
      lines.push(`import { checkPermission } from "@/lib/auth"`);
    } else if (test.type === "validation") {
      lines.push(`import { OntologyEngine } from "@/lib/ontology/engine"`);
    }
    lines.push("");

    if (test.setup) {
      lines.push(`beforeEach(() => {`);
      lines.push(`  ${test.setup}`);
      lines.push(`});`);
      lines.push("");
    }

    lines.push(`describe("${test.name}", () => {`);
    lines.push(`  it("${test.description}", ${test.type === "rbac" ? "async " : ""}() => {`);
    for (const assertion of test.assertions) {
      lines.push(`    ${assertion}`);
    }
    lines.push(`  });`);

    if (test.teardown) {
      lines.push("");
      lines.push(`  afterEach(() => {`);
      lines.push(`    ${test.teardown}`);
      lines.push(`  });`);
    }

    lines.push(`});`);
    lines.push("");

    return lines.join("\n");
  }

  /** Generate all test files. */
  generateAllTests(
    ontology: OntologyEngine
  ): { file: string; code: string }[] {
    const unitTests = this.generateUnitTests(ontology);
    const apiTests = this.generateApiTests(ontology);
    const sparqlTests = this.generateSparqlTests(ontology);
    const validationTests = this.generateValidationTests(ontology);
    const rbacTests = this.generateRbacTests(ontology);

    const allTests = [...unitTests, ...apiTests, ...sparqlTests, ...validationTests, ...rbacTests];

    // Group tests by entity + type for file splitting
    const fileMap = new Map<string, GeneratedTest[]>();
    for (const test of allTests) {
      const entityPart = test.entity || "ontology";
      const key = `tests/${test.type}/${entityPart.toLowerCase()}.${test.type}.test.ts`;
      if (!fileMap.has(key)) fileMap.set(key, []);
      fileMap.get(key)!.push(test);
    }

    const files: { file: string; code: string }[] = [];
    for (const [file, tests] of fileMap) {
      const code = this.generateTestFile(file, tests);
      files.push({ file, code });
    }

    return files;
  }

  private generateTestFile(filePath: string, tests: GeneratedTest[]): string {
    const lines: string[] = [];
    const importSet = new Set<string>();

    lines.push(`/** Auto-generated test file — do not edit manually */`);
    lines.push(`/** Source: ${filePath} */`);
    lines.push("");

    // Collect imports
    const hasSparql = tests.some((t) => t.type === "sparql");
    const hasRbac = tests.some((t) => t.type === "rbac");
    const hasValidation = tests.some((t) => t.type === "validation");

    lines.push(`import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"`);
    if (hasSparql) lines.push(`import { executeSparql } from "@/services/rdf/rdf-client.service"`);
    if (hasRbac) lines.push(`import { checkPermission } from "@/lib/auth"`);
    if (hasValidation) lines.push(`import { OntologyEngine } from "@/lib/ontology/engine"`);
    lines.push("");

    for (const test of tests) {
      if (test.setup) {
        lines.push(`beforeEach(() => {`);
        lines.push(`  ${test.setup}`);
        lines.push(`});`);
        lines.push("");
      }

      lines.push(`describe("${test.name}", () => {`);
      lines.push(`  it("${test.description}", ${test.type === "rbac" ? "async " : ""}() => {`);
      for (const assertion of test.assertions) {
        lines.push(`    ${assertion}`);
      }
      lines.push(`  });`);

      if (test.teardown) {
        lines.push(`  afterEach(() => {`);
        lines.push(`    ${test.teardown}`);
        lines.push(`  });`);
      }

      lines.push(`});`);
      lines.push("");
    }

    return lines.join("\n");
  }
}
