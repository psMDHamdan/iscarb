/**
 * PaperCollection entity mapper — converts Prisma PaperCollection to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PaperCollectionEntity {
  id: string;
  studentId: string;
  title: string;
  description?: string | null;
  paperCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const paperCollectionMapper: RdfMapper<PaperCollectionEntity> = {
  entityType: "PaperCollection",
  classUri: classUri("PaperCollection"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PaperCollection", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PaperCollection")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:paperCount", entity.paperCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isPublic", entity.isPublic, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
