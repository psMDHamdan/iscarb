/**
 * AiPrompt entity mapper — converts Prisma AiPrompt to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiPromptEntity {
  id: string;
  unitId?: string | null;
  unit?: string | null;
  stage: string;
  modelTag: string;
  systemPrompt: string;
  userTemplate: string;
  temperature: number;
  createdAt: Date;
}

export const aiPromptMapper: RdfMapper<AiPromptEntity> = {
  entityType: "AiPrompt",
  classUri: classUri("AiPrompt"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiPrompt", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiPrompt")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.unitId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:unitId", entity.unitId, "xsd:string"));
    }
    if (entity.unit != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:unit", entity.unit, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:stage", entity.stage, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:modelTag", entity.modelTag, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:systemPrompt", entity.systemPrompt, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userTemplate", entity.userTemplate, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:temperature", entity.temperature, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
