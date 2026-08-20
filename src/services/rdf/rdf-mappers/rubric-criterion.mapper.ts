/**
 * RubricCriterion entity mapper — converts Prisma RubricCriterion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface RubricCriterionEntity {
  id: string;
  rubricId: string;
  rubric: string;
  name: string;
  description?: string | null;
  weight: number;
  maxScore: number;
  keywords: string;
  order: number;
  createdAt: Date;
}

export const rubricCriterionMapper: RdfMapper<RubricCriterionEntity> = {
  entityType: "RubricCriterion",
  classUri: classUri("RubricCriterion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("RubricCriterion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("RubricCriterion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:rubricId", entity.rubricId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:rubric", entity.rubric, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:weight", entity.weight, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:maxScore", entity.maxScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:keywords", entity.keywords, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
