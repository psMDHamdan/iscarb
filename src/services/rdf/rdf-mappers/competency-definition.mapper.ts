/**
 * CompetencyDefinition entity mapper — converts Prisma CompetencyDefinition to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CompetencyDefinitionEntity {
  id: string;
  frameworkId: string;
  framework: string;
  name: string;
  description?: string | null;
  category: string;
  level: string;
  parentId?: string | null;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}

export const competencyDefinitionMapper: RdfMapper<CompetencyDefinitionEntity> = {
  entityType: "CompetencyDefinition",
  classUri: classUri("CompetencyDefinition"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CompetencyDefinition", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CompetencyDefinition")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:frameworkId", entity.frameworkId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:framework", entity.framework, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:level", entity.level, "xsd:string"));
    if (entity.parentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentId", entity.parentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:weight", entity.weight, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
