/**
 * ScedField entity mapper — converts Prisma ScedField to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ScedFieldEntity {
  id: string;
  code: string;
  kind: string;
  nameEn: string;
  nameAr: string;
  parentCode?: string | null;
  nqfLevel?: number | null;
  iscedLevel?: number | null;
  coursesEn?: string | null;
  coursesAr?: string | null;
  createdAt: Date;
}

export const scedFieldMapper: RdfMapper<ScedFieldEntity> = {
  entityType: "ScedField",
  classUri: classUri("ScedField"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ScedField", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ScedField")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:code", entity.code, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:kind", entity.kind, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:nameEn", entity.nameEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:nameAr", entity.nameAr, "xsd:string"));
    if (entity.parentCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentCode", entity.parentCode, "xsd:string"));
    }
    if (entity.nqfLevel != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nqfLevel", entity.nqfLevel, "xsd:decimal"));
    }
    if (entity.iscedLevel != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:iscedLevel", entity.iscedLevel, "xsd:decimal"));
    }
    if (entity.coursesEn != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:coursesEn", entity.coursesEn, "xsd:string"));
    }
    if (entity.coursesAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:coursesAr", entity.coursesAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
