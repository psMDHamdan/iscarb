/**
 * AssessmentModule entity mapper — converts Prisma AssessmentModule to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AssessmentModuleEntity {
  id: string;
  code: string;
  title: string;
  dimension: string;
  specialization?: string | null;
  level: string;
  framework: string;
  generated: boolean;
  createdAt: Date;
}

export const assessmentModuleMapper: RdfMapper<AssessmentModuleEntity> = {
  entityType: "AssessmentModule",
  classUri: classUri("AssessmentModule"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AssessmentModule", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AssessmentModule")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:code", entity.code, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dimension", entity.dimension, "xsd:string"));
    if (entity.specialization != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:specialization", entity.specialization, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:level", entity.level, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:framework", entity.framework, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:generated", entity.generated, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
