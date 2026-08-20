/**
 * Rubric entity mapper — converts Prisma Rubric to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface RubricEntity {
  id: string;
  assessmentId: string;
  title: string;
  description?: string | null;
  createdAt: Date;
}

export const rubricMapper: RdfMapper<RubricEntity> = {
  entityType: "Rubric",
  classUri: classUri("Rubric"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Rubric", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Rubric")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:assessmentId", entity.assessmentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
