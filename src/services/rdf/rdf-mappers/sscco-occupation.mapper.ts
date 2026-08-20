/**
 * SsccoOccupation entity mapper — converts Prisma SsccoOccupation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SsccoOccupationEntity {
  id: string;
  code: string;
  kind: string;
  nameEn: string;
  nameAr: string;
  parentCode?: string | null;
  iscoCode?: string | null;
  skillLevel?: number | null;
  createdAt: Date;
}

export const ssccoOccupationMapper: RdfMapper<SsccoOccupationEntity> = {
  entityType: "SsccoOccupation",
  classUri: classUri("SsccoOccupation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SsccoOccupation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SsccoOccupation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:code", entity.code, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:kind", entity.kind, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:nameEn", entity.nameEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:nameAr", entity.nameAr, "xsd:string"));
    if (entity.parentCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:parentCode", entity.parentCode, "xsd:string"));
    }
    if (entity.iscoCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:iscoCode", entity.iscoCode, "xsd:string"));
    }
    if (entity.skillLevel != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:skillLevel", entity.skillLevel, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
