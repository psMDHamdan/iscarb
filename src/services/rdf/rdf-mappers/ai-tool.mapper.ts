/**
 * AiTool entity mapper — converts Prisma AiTool to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiToolEntity {
  id: string;
  name: string;
  description: string;
  parameters: string;
  category: string;
  isActive: boolean;
  requiredRole?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const aiToolMapper: RdfMapper<AiToolEntity> = {
  entityType: "AiTool",
  classUri: classUri("AiTool"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiTool", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiTool")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:parameters", entity.parameters, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.isActive, "xsd:boolean"));
    if (entity.requiredRole != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:requiredRole", entity.requiredRole, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
