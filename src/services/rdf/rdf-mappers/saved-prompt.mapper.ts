/**
 * SavedPrompt entity mapper — converts Prisma SavedPrompt to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SavedPromptEntity {
  id: string;
  facultyId: string;
  title: string;
  prompt: string;
  category: string;
  usageCount: number;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const savedPromptMapper: RdfMapper<SavedPromptEntity> = {
  entityType: "SavedPrompt",
  classUri: classUri("SavedPrompt"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SavedPrompt", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SavedPrompt")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:prompt", entity.prompt, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:usageCount", entity.usageCount, "xsd:decimal"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
