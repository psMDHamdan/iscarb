/**
 * TeachingPlan entity mapper — converts Prisma TeachingPlan to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface TeachingPlanEntity {
  id: string;
  facultyId: string;
  courseId?: string | null;
  title: string;
  description?: string | null;
  planType: string;
  startDate?: Date | null;
  endDate?: Date | null;
  status: string;
  aiGenerated: boolean;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const teachingPlanMapper: RdfMapper<TeachingPlanEntity> = {
  entityType: "TeachingPlan",
  classUri: classUri("TeachingPlan"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("TeachingPlan", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("TeachingPlan")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:planType", entity.planType, "xsd:string"));
    if (entity.startDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.endDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:aiGenerated", entity.aiGenerated, "xsd:boolean"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
