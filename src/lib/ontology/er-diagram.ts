/**
 * ER Diagram Generators — produces Mermaid syntax from ontology data.
 */
import type { Ontology, OntologyClass, OntologyProperty } from "@/lib/ontology-parser";

function pascalCase(s: string): string {
  return s.replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

function escapeId(s: string): string {
  // Mermaid uses backticks for IDs with special characters
  return s.includes(" ") || s.includes("-") ? `"${s}"` : s;
}

// ── ER Diagram ──────────────────────────────────────────────────────────────

/**
 * Generate a Mermaid `erDiagram` block from the ontology.
 */
export function generateErDiagram(ontology: Ontology): string {
  const classMap = new Map(ontology.classes.map((c) => [c.id, c]));
  const propsByDomain = new Map<string, OntologyProperty[]>();
  for (const prop of ontology.properties) {
    if (!propsByDomain.has(prop.domain)) propsByDomain.set(prop.domain, []);
    propsByDomain.get(prop.domain)!.push(prop);
  }

  const lines: string[] = ["erDiagram"];

  for (const cls of ontology.classes) {
    const entityName = pascalCase(cls.id);
    lines.push(`    ${escapeId(entityName)} {`);

    // Datatype properties → attributes
    const dtProps = (propsByDomain.get(cls.id) || []).filter((p) => p.type === "DatatypeProperty");
    for (const prop of dtProps) {
      const attrName = prop.label.replace(/\s+/g, "_").toLowerCase();
      const attrType = mapMermaidType(prop.range);
      lines.push(`        ${attrType} ${escapeId(attrName)}`);
    }

    // Inherited datatype properties
    let parent = cls.parentClass;
    while (parent && parent !== "Entity") {
      const parentProps = (propsByDomain.get(parent) || []).filter((p) => p.type === "DatatypeProperty");
      for (const prop of parentProps) {
        const attrName = prop.label.replace(/\s+/g, "_").toLowerCase();
        const attrType = mapMermaidType(prop.range);
        lines.push(`        ${attrType} ${escapeId(attrName)}`);
      }
      parent = classMap.get(parent)?.parentClass;
    }

    // Foreign key fields from object properties
    const objProps = (propsByDomain.get(cls.id) || []).filter((p) => p.type === "ObjectProperty");
    for (const prop of objProps) {
      if (prop.range === "Entity") continue;
      const fkName = prop.label.replace(/\s+/g, "_").toLowerCase() + "_id";
      lines.push(`        string ${escapeId(fkName)}`);
    }

    lines.push(`    }`);
  }

  // Relationships
  const seenRels = new Set<string>();
  for (const prop of ontology.properties) {
    if (prop.type !== "ObjectProperty") continue;
    if (prop.range === "Entity" && prop.domain === "Entity") continue;

    const from = pascalCase(prop.domain);
    const to = pascalCase(prop.range);
    const relKey = `${from}-${to}-${prop.id}`;
    if (seenRels.has(relKey)) continue;
    seenRels.add(relKey);

    const cardinality = inferCardinality(prop, ontology);
    lines.push(`    ${escapeId(from)} ${cardinality} ${escapeId(to)} : ${prop.label}`);
  }

  return lines.join("\n");
}

// ── Class Diagram ───────────────────────────────────────────────────────────

/**
 * Generate a Mermaid `classDiagram` block from the ontology.
 */
export function generateMermaidClassDiagram(ontology: Ontology): string {
  const classMap = new Map(ontology.classes.map((c) => [c.id, c]));
  const propsByDomain = new Map<string, OntologyProperty[]>();
  for (const prop of ontology.properties) {
    if (!propsByDomain.has(prop.domain)) propsByDomain.set(prop.domain, []);
    propsByDomain.get(prop.domain)!.push(prop);
  }

  const lines: string[] = ["classDiagram"];

  for (const cls of ontology.classes) {
    const name = pascalCase(cls.id);
    lines.push(`    class ${escapeId(name)} {`);

    // Datatype properties
    const dtProps = (propsByDomain.get(cls.id) || []).filter((p) => p.type === "DatatypeProperty");
    for (const prop of dtProps) {
      const attrType = mapMermaidType(prop.range);
      const attrName = prop.label.replace(/\s+/g, "_").toLowerCase();
      lines.push(`        ${attrType} ${escapeId(attrName)}`);
    }

    lines.push(`    }`);

    // Inheritance
    if (cls.parentClass && cls.parentClass !== "Entity") {
      const parentName = pascalCase(cls.parentClass);
      lines.push(`    ${escapeId(parentName)} <|-- ${escapeId(name)}`);
    }
  }

  // Object property relationships
  for (const prop of ontology.properties) {
    if (prop.type !== "ObjectProperty") continue;
    if (prop.domain === prop.range) continue; // self-ref handled differently
    if (prop.range === "Entity") continue;

    const from = pascalCase(prop.domain);
    const to = pascalCase(prop.range);
    const label = prop.label;
    const arrow = prop.id.includes("inverseOf") ? "<|" : "--";
    lines.push(`    ${escapeId(from)} ${arrow} ${escapeId(to)} : ${label}`);
  }

  return lines.join("\n");
}

// ── Flowchart ───────────────────────────────────────────────────────────────

/**
 * Generate a Mermaid `flowchart TD` showing entity relationships.
 */
export function generateMermaidFlowchart(ontology: Ontology): string {
  const classMap = new Map(ontology.classes.map((c) => [c.id, c]));
  const propsByDomain = new Map<string, OntologyProperty[]>();
  for (const prop of ontology.properties) {
    if (!propsByDomain.has(prop.domain)) propsByDomain.set(prop.domain, []);
    propsByDomain.get(prop.domain)!.push(prop);
  }

  const lines: string[] = ["flowchart TD"];

  // Group classes by parent domain for layout
  const parentGroups = new Map<string, OntologyClass[]>();
  for (const cls of ontology.classes) {
    const parent = cls.parentClass || "root";
    if (!parentGroups.has(parent)) parentGroups.set(parent, []);
    parentGroups.get(parent)!.push(cls);
  }

  // Node definitions
  for (const cls of ontology.classes) {
    const name = pascalCase(cls.id);
    const dtCount = (propsByDomain.get(cls.id) || []).filter(
      (p) => p.type === "DatatypeProperty"
    ).length;
    const objCount = (propsByDomain.get(cls.id) || []).filter(
      (p) => p.type === "ObjectProperty"
    ).length;
    const lines2 = [`${cls.label}`];
    if (dtCount > 0) lines2.push(`${dtCount} properties`);
    if (objCount > 0) lines2.push(`${objCount} relations`);
    lines.push(`    ${escapeId(name)}["${lines2.join("<br/>")}"]`);
  }

  // Inheritance edges (solid)
  for (const cls of ontology.classes) {
    if (cls.parentClass) {
      const child = pascalCase(cls.id);
      const parent = pascalCase(cls.parentClass);
      lines.push(`    ${escapeId(parent)} --> ${escapeId(child)}`);
    }
  }

  // Object property edges (dashed)
  const seenRels = new Set<string>();
  for (const prop of ontology.properties) {
    if (prop.type !== "ObjectProperty") continue;
    if (prop.domain === prop.range) continue;
    if (prop.range === "Entity") continue;

    const from = pascalCase(prop.domain);
    const to = pascalCase(prop.range);
    const key = `${from}-${to}`;
    if (seenRels.has(key)) continue;
    seenRels.add(key);

    lines.push(`    ${escapeId(from)} -.->|${prop.label}| ${escapeId(to)}`);
  }

  // Styling
  lines.push("");
  lines.push("    classDef root fill:#f9f,stroke:#333,stroke-width:2px");
  lines.push("    classDef entity fill:#bbf,stroke:#333,stroke-width:1px");
  lines.push("    classDef event fill:#bfb,stroke:#333,stroke-width:1px");

  // Tag root and event classes
  const rootClasses = ontology.classes.filter((c) => !c.parentClass);
  if (rootClasses.length) {
    lines.push(`    class ${rootClasses.map((c) => escapeId(pascalCase(c.id))).join(",")} root`);
  }

  return lines.join("\n");
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function mapMermaidType(xsd: string): string {
  const bare = xsd.replace(/^xsd:/, "").toLowerCase();
  switch (bare) {
    case "int":
    case "integer":
      return "int";
    case "decimal":
    case "float":
    case "double":
      return "float";
    case "boolean":
      return "bool";
    case "date":
    case "datetime":
      return "date";
    default:
      return "string";
  }
}

function inferCardinality(
  prop: OntologyProperty,
  ontology: Ontology
): string {
  // Check inverse property to detect many-to-many
  const hasInverse = ontology.properties.some(
    (p) => p.type === "ObjectProperty" && p.range === prop.domain && p.domain === prop.range
  );
  if (hasInverse) return "}o--o{"; // many-to-many
  // Default: one-to-many (domain has many range)
  return "||--o{";
}
