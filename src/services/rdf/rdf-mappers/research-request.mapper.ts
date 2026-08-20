/**
 * ResearchRequest entity mapper — converts Prisma ResearchRequest to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchRequestEntity {
  id: string;
  userId?: string | null;
  title: string;
  topic: string;
  description: string;
  researchType: string;
  datasets: string;
  justification: string;
  status: string;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  doiAssigned?: string | null;
  submittedAt: Date;
  reviewedAt?: Date | null;
  approvedAt?: Date | null;
}

export const researchRequestMapper: RdfMapper<ResearchRequestEntity> = {
  entityType: "ResearchRequest",
  classUri: classUri("ResearchRequest"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchRequest", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchRequest")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.userId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:topic", entity.topic, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:researchType", entity.researchType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:datasets", entity.datasets, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:justification", entity.justification, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.reviewedBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reviewedBy", entity.reviewedBy, "xsd:string"));
    }
    if (entity.reviewNotes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reviewNotes", entity.reviewNotes, "xsd:string"));
    }
    if (entity.doiAssigned != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:doiAssigned", entity.doiAssigned, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:submittedAt", entity.submittedAt.toISOString(), "xsd:dateTime"));
    if (entity.reviewedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reviewedAt", entity.reviewedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.approvedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:approvedAt", entity.approvedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
