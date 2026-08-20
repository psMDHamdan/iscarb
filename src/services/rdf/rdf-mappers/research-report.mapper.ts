/**
 * ResearchReport entity mapper — converts Prisma ResearchReport to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchReportEntity {
  id: string;
  title: string;
  requestId?: string | null;
  request?: string | null;
  format: string;
  content: string;
  status: string;
  generatedAt: Date;
  exportedAt?: Date | null;
}

export const researchReportMapper: RdfMapper<ResearchReportEntity> = {
  entityType: "ResearchReport",
  classUri: classUri("ResearchReport"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchReport", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchReport")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.requestId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:requestId", entity.requestId, "xsd:string"));
    }
    if (entity.request != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:request", entity.request, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:format", entity.format, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:generatedAt", entity.generatedAt.toISOString(), "xsd:dateTime"));
    if (entity.exportedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:exportedAt", entity.exportedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
