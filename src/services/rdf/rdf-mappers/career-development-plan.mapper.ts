/**
 * CareerDevelopmentPlan entity mapper — converts Prisma CareerDevelopmentPlan to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerDevelopmentPlanEntity {
  id: string;
  studentId: string;
  targetRole?: string | null;
  targetIndustry?: string | null;
  timeline?: number | null;
  lastReviewDate?: Date | null;
  nextReviewDate?: Date | null;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const careerDevelopmentPlanMapper: RdfMapper<CareerDevelopmentPlanEntity> = {
  entityType: "CareerDevelopmentPlan",
  classUri: classUri("CareerDevelopmentPlan"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerDevelopmentPlan", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerDevelopmentPlan")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.targetRole != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetRole", entity.targetRole, "xsd:string"));
    }
    if (entity.targetIndustry != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetIndustry", entity.targetIndustry, "xsd:string"));
    }
    if (entity.timeline != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:timeline", entity.timeline, "xsd:decimal"));
    }
    if (entity.lastReviewDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastReviewDate", entity.lastReviewDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.nextReviewDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nextReviewDate", entity.nextReviewDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
