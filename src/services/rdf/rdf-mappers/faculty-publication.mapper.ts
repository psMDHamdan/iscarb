/**
 * FacultyPublication entity mapper — converts Prisma FacultyPublication to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyPublicationEntity {
  id: string;
  facultyId: string;
  title: string;
  journal?: string | null;
  year?: number | null;
  doi?: string | null;
  url?: string | null;
  citationCount: number;
  pubType: string;
  universityId?: string | null;
  createdAt: Date;
}

export const facultyPublicationMapper: RdfMapper<FacultyPublicationEntity> = {
  entityType: "FacultyPublication",
  classUri: classUri("FacultyPublication"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FacultyPublication", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FacultyPublication")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.journal != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:journal", entity.journal, "xsd:string"));
    }
    if (entity.year != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:year", entity.year, "xsd:decimal"));
    }
    if (entity.doi != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:doi", entity.doi, "xsd:string"));
    }
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:citationCount", entity.citationCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:pubType", entity.pubType, "xsd:string"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
