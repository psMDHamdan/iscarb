/**
 * CareerInterest entity mapper — converts Prisma CareerInterest to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerInterestEntity {
  id: string;
  studentId: string;
  cardId: string;
  status: string;
  createdAt: Date;
}

export const careerInterestMapper: RdfMapper<CareerInterestEntity> = {
  entityType: "CareerInterest",
  classUri: classUri("CareerInterest"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerInterest", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerInterest")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:cardId", entity.cardId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
