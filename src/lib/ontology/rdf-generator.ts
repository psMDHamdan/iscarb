/**
 * RDF Generator — generates RDF triples from the OntologyEngine and entity data.
 * The ontology is the single source of truth for class/property mappings.
 */
import {
  OntologyEngine,
  type OntologyClass,
  type ObjectProperty,
  type DatatypeProperty,
} from "./engine";

const ISCARB_NS = "https://iscarb.edu/ontology/";
const RDF_NS = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const RDFS_NS = "http://www.w3.org/2000/01/rdf-schema#";
const OWL_NS = "http://www.w3.org/2002/07/owl#";
const XSD_NS = "http://www.w3.org/2001/XMLSchema#";
const PROV_NS = "http://www.w3.org/ns/prov#";

export interface Triple {
  subject: string;
  predicate: string;
  object: string;
  graph?: string;
  timestamp?: Date;
  version?: number;
}

/** Map common data field names to ontology property names */
const FIELD_TO_PROPERTY: Record<string, string> = {
  id: "hasId",
  name: "hasName",
  nameAr: "hasNameAr",
  email: "hasEmail",
  description: "hasDescription",
  status: "hasStatus",
  gpa: "hasGPA",
  major: "hasMajor",
  rank: "hasRank",
  specialization: "hasSpecialization",
  courseCode: "hasCourseCode",
  creditHours: "hasCreditHours",
  scoreValue: "hasScoreValue",
  percentage: "hasPercentage",
  maxScore: "hasMaxScore",
  skillLevel: "hasSkillLevel",
  weight: "hasWeight",
  jobTitle: "hasJobTitle",
  salary: "hasSalary",
  matchScore: "hasMatchScore",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

/** Datatype property XSD mapping */
const DATATYPE_TO_XSD: Record<string, string> = {
  string: "xsd:string",
  integer: "xsd:integer",
  float: "xsd:decimal",
  boolean: "xsd:boolean",
  date: "xsd:date",
  datetime: "xsd:dateTime",
  text: "xsd:string",
  json: "xsd:string",
};

/** Determine the XSD datatype for a JavaScript value */
function xsdType(value: unknown): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? "xsd:integer" : "xsd:decimal";
  }
  if (typeof value === "boolean") return "xsd:boolean";
  if (value instanceof Date) return "xsd:dateTime";
  return "xsd:string";
}

/** Format a literal value for Turtle output */
function formatLiteral(value: unknown): string {
  const str = String(value);
  const escaped = str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  return `"${escaped}"`;
}

/** Check if a value looks like a URI reference */
function isUriRef(value: string): boolean {
  return /^(https?:\/\/|urn:|iscarb:)/.test(value);
}

/** Get ancestor chain for a class */
function getAncestors(classId: string, engine: OntologyEngine): Set<string> {
  const ancestors = new Set<string>();
  let current = classId;
  while (current) {
    ancestors.add(current);
    const cls = engine.classes.get(current);
    current = cls?.parentClass || "";
  }
  return ancestors;
}

export class RdfGenerator {
  /**
   * Generate triples for a single entity instance given its type and data.
   * Looks up the ontology class and its properties to generate typed triples.
   */
  generateTriples(
    entity: string,
    data: Record<string, any>,
    ontology: OntologyEngine
  ): Triple[] {
    const triples: Triple[] = [];
    const subject = `iSCARB:${data.id || "unknown"}`;
    const now = new Date();

    // rdf:type triple
    triples.push({
      subject,
      predicate: `${RDF_NS}type`,
      object: `iSCARB:${entity}`,
      timestamp: now,
    });

    // Resolve ancestor chain for property matching
    const ancestors = getAncestors(entity, ontology);

    // Collect all properties that apply to this entity (including inherited)
    const applicableObjProps: ObjectProperty[] = [];
    for (const [, prop] of ontology.objectProperties) {
      if (ancestors.has(prop.domain)) {
        applicableObjProps.push(prop);
      }
    }

    const applicableDtProps: DatatypeProperty[] = [];
    for (const [, prop] of ontology.datatypeProperties) {
      if (ancestors.has(prop.domain)) {
        applicableDtProps.push(prop);
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue;
      if (key === "id") continue;

      // Resolve the predicate name from field name
      const propName = FIELD_TO_PROPERTY[key] || key;

      // Check if it matches an object property
      const objProp = applicableObjProps.find(
        (p) => p.name === propName || p.id === propName || p.id.endsWith(`_${propName}`)
      );

      if (objProp) {
        const objectUri = typeof value === "string" && isUriRef(value)
          ? value
          : `iSCARB:${value}`;
        triples.push({ subject, predicate: `iSCARB:${objProp.name}`, object: objectUri, timestamp: now });
        continue;
      }

      // Check if it matches a datatype property
      const dtProp = applicableDtProps.find(
        (p) => p.name === propName || p.id === propName || p.id.endsWith(`_${propName}`)
      );

      if (dtProp) {
        const xsd = DATATYPE_TO_XSD[dtProp.datatype] || "xsd:string";
        const literal = `${formatLiteral(value)}^^${xsd}`;
        triples.push({ subject, predicate: `iSCARB:${dtProp.name}`, object: literal, timestamp: now });
        continue;
      }

      // Universal Entity properties — always generate if field matches
      const universalPredicates: Record<string, string> = {
        name: "hasName",
        nameAr: "hasNameAr",
        email: "hasEmail",
        description: "hasDescription",
        status: "hasStatus",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      };

      if (universalPredicates[key]) {
        const literal = `${formatLiteral(value)}^^${xsdType(value)}`;
        triples.push({ subject, predicate: `iSCARB:${universalPredicates[key]}`, object: literal, timestamp: now });
      }
    }

    return triples;
  }

  /**
   * Generate triples for all individuals stored in the ontology engine.
   */
  generateAllTriples(ontology: OntologyEngine): Triple[] {
    const triples: Triple[] = [];
    const now = new Date();

    for (const [id, individual] of ontology.individuals) {
      const subject = `iSCARB:${id}`;

      // rdf:type
      triples.push({
        subject,
        predicate: `${RDF_NS}type`,
        object: `iSCARB:${individual.classType}`,
        timestamp: now,
      });

      // Instance properties
      for (const [propName, propValue] of Object.entries(individual.properties)) {
        if (propValue === undefined || propValue === null) continue;

        const propDef = ontology.datatypeProperties.get(propName) ||
          [...ontology.datatypeProperties.values()].find((p) => p.name === propName);

        if (propDef) {
          const xsd = DATATYPE_TO_XSD[propDef.datatype] || "xsd:string";
          triples.push({
            subject,
            predicate: `iSCARB:${propDef.name}`,
            object: `${formatLiteral(propValue)}^^${xsd}`,
            timestamp: now,
          });
        } else if (typeof propValue === "string" && isUriRef(propValue)) {
          triples.push({
            subject,
            predicate: `iSCARB:${propName}`,
            object: propValue,
            timestamp: now,
          });
        } else {
          triples.push({
            subject,
            predicate: `iSCARB:${propName}`,
            object: `${formatLiteral(propValue)}^^xsd:string`,
            timestamp: now,
          });
        }
      }
    }

    return triples;
  }

  /**
   * Generate RDFS triples describing the ontology itself.
   * Classes, properties, domains, ranges, labels, comments, inheritance.
   */
  generateSchemaTriples(ontology: OntologyEngine): Triple[] {
    const triples: Triple[] = [];
    const now = new Date();

    // Ontology declaration
    triples.push({
      subject: ISCARB_NS,
      predicate: `${RDF_NS}type`,
      object: `${OWL_NS}Ontology`,
      timestamp: now,
    });

    // Class triples
    for (const [id, cls] of ontology.classes) {
      const classUri = `iSCARB:${id}`;

      // rdf:type owl:Class
      triples.push({
        subject: classUri,
        predicate: `${RDF_NS}type`,
        object: `${OWL_NS}Class`,
        timestamp: now,
      });

      // rdfs:label
      triples.push({
        subject: classUri,
        predicate: `${RDFS_NS}label`,
        object: `"${cls.label}"@en`,
        timestamp: now,
      });

      // rdfs:comment / description
      if (cls.description) {
        triples.push({
          subject: classUri,
          predicate: `${RDFS_NS}comment`,
          object: `"${cls.description}"`,
          timestamp: now,
        });
      }

      // rdfs:subClassOf
      if (cls.parentClass) {
        triples.push({
          subject: classUri,
          predicate: `${RDFS_NS}subClassOf`,
          object: `iSCARB:${cls.parentClass}`,
          timestamp: now,
        });
      }

      // owl:equivalentClass
      for (const equiv of cls.equivalentClasses) {
        triples.push({
          subject: classUri,
          predicate: `${OWL_NS}equivalentClass`,
          object: equiv,
          timestamp: now,
        });
      }

      // owl:disjointWith
      for (const disjoint of cls.disjointWith) {
        triples.push({
          subject: classUri,
          predicate: `${OWL_NS}disjointWith`,
          object: `iSCARB:${disjoint}`,
          timestamp: now,
        });
      }
    }

    // Object property triples
    for (const [id, prop] of ontology.objectProperties) {
      const propUri = `iSCARB:${prop.name}`;

      triples.push({
        subject: propUri,
        predicate: `${RDF_NS}type`,
        object: `${OWL_NS}ObjectProperty`,
        timestamp: now,
      });

      triples.push({
        subject: propUri,
        predicate: `${RDFS_NS}label`,
        object: `"${prop.name}"@en`,
        timestamp: now,
      });

      triples.push({
        subject: propUri,
        predicate: `${RDFS_NS}domain`,
        object: `iSCARB:${prop.domain}`,
        timestamp: now,
      });

      triples.push({
        subject: propUri,
        predicate: `${RDFS_NS}range`,
        object: `iSCARB:${prop.range}`,
        timestamp: now,
      });

      // Characteristics
      if (prop.characteristics.includes("transitive")) {
        triples.push({
          subject: propUri,
          predicate: `${OWL_NS}transitive`,
          object: `"true"^^xsd:boolean`,
          timestamp: now,
        });
      }
      if (prop.characteristics.includes("symmetric")) {
        triples.push({
          subject: propUri,
          predicate: `${OWL_NS}symmetric`,
          object: `"true"^^xsd:boolean`,
          timestamp: now,
        });
      }
      if (prop.characteristics.includes("functional")) {
        triples.push({
          subject: propUri,
          predicate: `${OWL_NS}functional`,
          object: `"true"^^xsd:boolean`,
          timestamp: now,
        });
      }

      // Inverse
      if (prop.inverse) {
        triples.push({
          subject: propUri,
          predicate: `${OWL_NS}inverseOf`,
          object: `iSCARB:${prop.inverse}`,
          timestamp: now,
        });
      }

      // Sub-property
      if (prop.subPropertyOf) {
        triples.push({
          subject: propUri,
          predicate: `${RDFS_NS}subPropertyOf`,
          object: `iSCARB:${prop.subPropertyOf}`,
          timestamp: now,
        });
      }
    }

    // Datatype property triples
    for (const [id, prop] of ontology.datatypeProperties) {
      const propUri = `iSCARB:${prop.name}`;

      triples.push({
        subject: propUri,
        predicate: `${RDF_NS}type`,
        object: `${OWL_NS}DatatypeProperty`,
        timestamp: now,
      });

      triples.push({
        subject: propUri,
        predicate: `${RDFS_NS}label`,
        object: `"${prop.name}"@en`,
        timestamp: now,
      });

      triples.push({
        subject: propUri,
        predicate: `${RDFS_NS}domain`,
        object: `iSCARB:${prop.domain}`,
        timestamp: now,
      });

      const xsdDatatype = DATATYPE_TO_XSD[prop.datatype] || "xsd:string";
      triples.push({
        subject: propUri,
        predicate: `${RDFS_NS}range`,
        object: `${xsdDatatype.startsWith("xsd:") ? XSD_NS + xsdDatatype.slice(4) : xsdDatatype}`,
        timestamp: now,
      });
    }

    return triples;
  }

  /**
   * Serialize triples to Turtle format.
   */
  toTurtle(triples: Triple[]): string {
    const lines: string[] = [
      "@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .",
      "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
      "@prefix owl:  <http://www.w3.org/2002/07/owl#> .",
      "@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .",
      "@prefix iscarb: <https://iscarb.edu/ontology/> .",
      "@prefix prov: <http://www.w3.org/ns/prov#> .",
      "",
    ];

    // Group by subject for compact Turtle output
    const bySubject = new Map<string, Triple[]>();
    for (const t of triples) {
      if (!bySubject.has(t.subject)) bySubject.set(t.subject, []);
      bySubject.get(t.subject)!.push(t);
    }

    for (const [subject, group] of bySubject) {
      const s = this.abbreviate(subject);
      for (let i = 0; i < group.length; i++) {
        const t = group[i];
        const p = this.abbreviate(t.predicate);
        const o = this.abbreviateObject(t.object);
        const connector = i === 0 ? s : "    ";
        const terminator = i === group.length - 1 ? " ." : " ;";
        lines.push(`  ${connector} ${p} ${o}${terminator}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Serialize triples to JSON-LD format.
   */
  toJsonLd(triples: Triple[]): object {
    const context: Record<string, string> = {
      rdf: RDF_NS,
      rdfs: RDFS_NS,
      owl: OWL_NS,
      xsd: XSD_NS,
      iscarb: ISCARB_NS,
      prov: PROV_NS,
    };

    const bySubject = new Map<string, Triple[]>();
    for (const t of triples) {
      if (!bySubject.has(t.subject)) bySubject.set(t.subject, []);
      bySubject.get(t.subject)!.push(t);
    }

    const graph: object[] = [];
    for (const [subject, group] of bySubject) {
      const node: Record<string, any> = { "@id": subject };
      for (const t of group) {
        const pred = this.abbreviate(t.predicate);
        if (t.object.startsWith('"')) {
          const match = t.object.match(/^"(.+)"(?:\^\^(.+))?$/);
          if (match) {
            const val: Record<string, any> = { "@value": match[1] };
            if (match[2]) val["@type"] = match[2];
            if (!node[pred]) node[pred] = [];
            (node[pred] as any[]).push(val);
          }
        } else {
          if (!node[pred]) node[pred] = [];
          (node[pred] as any[]).push({ "@id": this.abbreviate(t.object) });
        }
      }
      graph.push(node);
    }

    return { "@context": context, "@graph": graph };
  }

  /**
   * Serialize triples to N-Triples format.
   */
  toNTriples(triples: Triple[]): string {
    return triples
      .map((t) => {
        const s = `<${this.expandIri(t.subject)}>`;
        const p = t.predicate.startsWith("http") ? `<${t.predicate}>` : `<${this.expandIri(t.predicate)}>`;
        const o = t.object.startsWith('"')
          ? t.object
          : t.object.startsWith("http")
            ? `<${t.object}>`
            : `<${this.expandIri(t.object)}>`;
        return `${s} ${p} ${o} .`;
      })
      .join("\n");
  }

  /**
   * Parse Turtle string to triples.
   */
  fromTurtle(turtle: string): Triple[] {
    const triples: Triple[] = [];
    const prefixes: Record<string, string> = {};
    const lines = turtle.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const prefixMatch = trimmed.match(/^@prefix\s+(\w*):\s*<([^>]+)>/);
      if (prefixMatch) {
        prefixes[prefixMatch[1]] = prefixMatch[2];
        continue;
      }

      // Parse triple lines
      const clean = trimmed.replace(/\s*\.\s*$/, "").replace(/\s*;\s*$/, "");
      if (clean.includes("a ") || clean.includes("rdfs:") || clean.includes("iscarb:") || clean.includes("rdf:") || clean.includes("owl:")) {
        const parts = clean.split(/\s+/);
        if (parts.length >= 3) {
          triples.push({
            subject: this.expandPrefix(parts[0], prefixes),
            predicate: this.expandPrefix(parts[1], prefixes),
            object: this.expandPrefix(parts.slice(2).join(" "), prefixes),
            timestamp: new Date(),
          });
        }
      }
    }

    return triples;
  }

  // --- Private helpers ---

  private abbreviate(iri: string): string {
    if (iri.startsWith(ISCARB_NS)) return `iscarb:${iri.slice(ISCARB_NS.length)}`;
    if (iri === `${RDF_NS}type`) return "rdf:type";
    if (iri.startsWith(RDFS_NS)) return `rdfs:${iri.slice(RDFS_NS.length)}`;
    if (iri.startsWith(OWL_NS)) return `owl:${iri.slice(OWL_NS.length)}`;
    if (iri.startsWith(XSD_NS)) return `xsd:${iri.slice(XSD_NS.length)}`;
    if (iri.startsWith(PROV_NS)) return `prov:${iri.slice(PROV_NS.length)}`;
    return iri;
  }

  private abbreviateObject(obj: string): string {
    if (obj.startsWith('"')) return obj;
    return this.abbreviate(obj);
  }

  private expandIri(iri: string): string {
    if (iri.startsWith("iSCARB:")) return `${ISCARB_NS}${iri.slice(7)}`;
    const map: Record<string, string> = {
      rdf: RDF_NS,
      rdfs: RDFS_NS,
      owl: OWL_NS,
      xsd: XSD_NS,
      iscarb: ISCARB_NS,
      prov: PROV_NS,
    };
    const colonIdx = iri.indexOf(":");
    if (colonIdx > 0) {
      const prefix = iri.slice(0, colonIdx);
      const local = iri.slice(colonIdx + 1);
      if (map[prefix]) return `${map[prefix]}${local}`;
    }
    return iri;
  }

  private expandPrefix(term: string, prefixes: Record<string, string>): string {
    if (term.startsWith("<") && term.endsWith(">")) return term.slice(1, -1);
    if (term.startsWith('"')) return term;
    const colonIdx = term.indexOf(":");
    if (colonIdx > 0) {
      const prefix = term.slice(0, colonIdx);
      const local = term.slice(colonIdx + 1);
      if (prefixes[prefix]) return `${prefixes[prefix]}${local}`;
    }
    return term;
  }
}
