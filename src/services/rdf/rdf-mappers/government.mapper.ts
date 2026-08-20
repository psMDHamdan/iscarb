/**
 * Government entity mapper — converts Prisma Government to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface GovernmentEntity {
  id: string;
  countryId: string;
  name: string;
  nameAr?: string | null;
  type: string;
  code?: string | null;
  createdAt: Date;
}

export const governmentMapper: RdfMapper<GovernmentEntity> = {
  entityType: "Government",
  classUri: classUri("Government"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Government", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Government")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:countryId", entity.countryId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.nameAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nameAr", entity.nameAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.code != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:code", entity.code, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
