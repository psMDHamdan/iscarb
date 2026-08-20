/**
 * Assessment entity mapper — converts Prisma Assessment to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfTriple, rdfLiteralTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AssessmentEntity {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  timeLimit?: number | null;
  passPercentage?: number | null;
  createdBy?: string | null;
  universityId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const assessmentMapper: RdfMapper<AssessmentEntity> = {
  entityType: "Assessment",
  classUri: classUri("Assessment"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Assessment", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Assessment")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasName", entity.title, "xsd:string"),
    ];

    if (entity.description) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasDescription", entity.description, "xsd:string"));
    }
    if (entity.status) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasStatus", entity.status, "xsd:string"));
    }
    if (entity.timeLimit != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasTimeLimit", entity.timeLimit, "xsd:integer"));
    }
    if (entity.passPercentage != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasPassPercentage", entity.passPercentage, "xsd:decimal"));
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
    const findVal = (p: string) => {
      const v = triples.find((t) => t.p === p)?.o;
      return typeof v === "object" ? v.value : v;
    };

    return {
      id: findVal("iscarb:hasId"),
      title: findVal("iscarb:hasName"),
      description: findVal("iscarb:hasDescription") || null,
      status: findVal("iscarb:hasStatus") || null,
    };
  },
};
