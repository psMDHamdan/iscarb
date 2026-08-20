/**
 * ResearchHypothesis entity mapper — converts Prisma ResearchHypothesis to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchHypothesisEntity {
  id: string;
  projectId: string;
  project: string;
  statement: string;
  confidence: number;
  evidence?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const researchHypothesisMapper: RdfMapper<ResearchHypothesisEntity> = {
  entityType: "ResearchHypothesis",
  classUri: classUri("ResearchHypothesis"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchHypothesis", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchHypothesis")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:projectId", entity.projectId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:project", entity.project, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:statement", entity.statement, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:confidence", entity.confidence, "xsd:decimal"));
    if (entity.evidence != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:evidence", entity.evidence, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
