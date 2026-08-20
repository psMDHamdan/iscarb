/**
 * ReadingList entity mapper — converts Prisma ReadingList to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReadingListEntity {
  id: string;
  courseId: string;
  title: string;
  items?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const readingListMapper: RdfMapper<ReadingListEntity> = {
  entityType: "ReadingList",
  classUri: classUri("ReadingList"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReadingList", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReadingList")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.items != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:items", entity.items, "xsd:string"));
    }
    if (entity.createdBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
