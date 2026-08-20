/**
 * AIInterventionCampaign entity mapper — converts Prisma AIInterventionCampaign to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AIInterventionCampaignEntity {
  id: string;
  studentId: string;
  interventionType: string;
  trigger: string;
  recommendedActions: string;
  status: string;
  sentAt: Date;
  respondedAt?: Date | null;
  outcome?: string | null;
  createdAt: Date;
}

export const aiinterventionCampaignMapper: RdfMapper<AIInterventionCampaignEntity> = {
  entityType: "AIInterventionCampaign",
  classUri: classUri("AIInterventionCampaign"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AIInterventionCampaign", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AIInterventionCampaign")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:interventionType", entity.interventionType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:trigger", entity.trigger, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:recommendedActions", entity.recommendedActions, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sentAt", entity.sentAt.toISOString(), "xsd:dateTime"));
    if (entity.respondedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:respondedAt", entity.respondedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.outcome != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:outcome", entity.outcome, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
