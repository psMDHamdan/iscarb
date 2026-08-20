/**
 * AiReflection entity mapper — converts Prisma AiReflection to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiReflectionEntity {
  id: string;
  planId: string;
  userId: string;
  content: string;
  insights?: string | null;
  confidence: number;
  createdAt: Date;
}

export const aiReflectionMapper: RdfMapper<AiReflectionEntity> = {
  entityType: "AiReflection",
  classUri: classUri("AiReflection"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiReflection", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiReflection")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:planId", entity.planId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    if (entity.insights != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:insights", entity.insights, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:confidence", entity.confidence, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
