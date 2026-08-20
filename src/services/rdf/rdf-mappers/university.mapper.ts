/**
 * University entity mapper — converts Prisma University to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface UniversityEntity {
  id: string;
  code: string;
  name: string;
  nameAr?: string | null;
  city?: string | null;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const universityMapper: RdfMapper<UniversityEntity> = {
  entityType: "University",
  classUri: classUri("University"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("University", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("University")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasCode", entity.code, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasName", entity.name, "xsd:string"),
    ];

    if (entity.nameAr) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasNameAr", entity.nameAr, "xsd:string"));
    }
    if (entity.city) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasCity", entity.city, "xsd:string"));
    }
    if (entity.active != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:isActive", entity.active, "xsd:boolean"));
    }
    if (entity.createdAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.updatedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
