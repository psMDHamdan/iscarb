/**
 * DocumentApproval entity mapper — converts Prisma DocumentApproval to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DocumentApprovalEntity {
  id: string;
  documentId: string;
  status: string;
  approverId: string;
  comments?: string | null;
  decidedAt?: Date | null;
  createdAt: Date;
}

export const documentApprovalMapper: RdfMapper<DocumentApprovalEntity> = {
  entityType: "DocumentApproval",
  classUri: classUri("DocumentApproval"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DocumentApproval", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DocumentApproval")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:documentId", entity.documentId, "xsd:string"));
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
