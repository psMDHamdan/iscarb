/**
 * FacultyBookmark entity mapper — converts Prisma FacultyBookmark to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyBookmarkEntity {
  id: string;
  facultyId: string;
  entityType: string;
  entityId: string;
  title: string;
  url?: string | null;
  universityId?: string | null;
  createdAt: Date;
}

export const facultyBookmarkMapper: RdfMapper<FacultyBookmarkEntity> = {
  entityType: "FacultyBookmark",
  classUri: classUri("FacultyBookmark"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FacultyBookmark", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FacultyBookmark")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
