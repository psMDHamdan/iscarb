/**
 * AIContentGeneration entity mapper — converts Prisma AIContentGeneration to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AIContentGenerationEntity {
  id: string;
  studentId: string;
  contentType: string;
  sourceId: string;
  sourceType: string;
  generatedContent: string;
  rating?: number | null;
  createdAt: Date;
}

export const aicontentGenerationMapper: RdfMapper<AIContentGenerationEntity> = {
  entityType: "AIContentGeneration",
  classUri: classUri("AIContentGeneration"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AIContentGeneration", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AIContentGeneration")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:contentType", entity.contentType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sourceId", entity.sourceId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sourceType", entity.sourceType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:generatedContent", entity.generatedContent, "xsd:string"));
    if (entity.rating != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rating", entity.rating, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
