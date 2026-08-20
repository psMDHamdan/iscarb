/**
 * Student entity mapper — converts Prisma Student to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteral, rdfTriple, rdfLiteralTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentEntity {
  id: string;
  name: string;
  email: string;
  gpa?: number | null;
  major?: string | null;
  cohort?: string | null;
  discoverable?: boolean;
  readinessScore?: number | null;
  universityId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const studentMapper: RdfMapper<StudentEntity> = {
  entityType: "Student",
  classUri: classUri("Student"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Student", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Student")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasName", entity.name, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasEmail", entity.email, "xsd:string"),
    ];

    if (entity.gpa != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasGPA", entity.gpa, "xsd:decimal"));
    }
    if (entity.major) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasMajor", entity.major, "xsd:string"));
    }
    if (entity.cohort) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasCohort", entity.cohort, "xsd:string"));
    }
    if (entity.discoverable != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:isDiscoverable", entity.discoverable, "xsd:boolean"));
    }
    if (entity.readinessScore != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasReadinessScore", entity.readinessScore, "xsd:decimal"));
    }
    if (entity.universityId) {
      triples.push(rdfTriple(uri, "iscarb:belongsToUniversity", instanceUri("University", universityCode, entity.universityId)));
    }
    if (entity.createdAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.updatedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    }

    return { graph, uri, triples };
  },

  fromTriples(triples) {
    const find = (p: string) => triples.find((t) => t.p === p)?.o;
    const findVal = (p: string) => {
      const v = find(p);
      return typeof v === "object" ? v.value : v;
    };

    return {
      id: findVal("iscarb:hasId"),
      name: findVal("iscarb:hasName"),
      email: findVal("iscarb:hasEmail"),
      gpa: parseFloat(findVal("iscarb:hasGPA") || "0") || null,
      major: findVal("iscarb:hasMajor") || null,
      discoverable: findVal("iscarb:isDiscoverable") === "true",
    };
  },
};
