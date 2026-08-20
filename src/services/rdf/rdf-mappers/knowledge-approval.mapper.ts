/**
 * KnowledgeApproval entity mapper — converts Prisma KnowledgeApproval to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeApprovalEntity {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  approverId: string;
  comments?: string | null;
  decidedAt?: Date | null;
  createdAt: Date;
}

export const knowledgeApprovalMapper: RdfMapper<KnowledgeApprovalEntity> = {
  entityType: "KnowledgeApproval",
  classUri: classUri("KnowledgeApproval"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeApproval", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeApproval")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:approverId", entity.approverId, "xsd:string"));
    if (entity.comments != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:comments", entity.comments, "xsd:string"));
    }
    if (entity.decidedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:decidedAt", entity.decidedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
