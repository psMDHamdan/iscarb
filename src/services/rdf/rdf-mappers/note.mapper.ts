/**
 * Note entity mapper — converts Prisma Note to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface NoteEntity {
  id: string;
  title: string;
  content?: string | null;
  authorId: string;
  organizationId?: string | null;
  visibility: string;
  tags?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const noteMapper: RdfMapper<NoteEntity> = {
  entityType: "Note",
  classUri: classUri("Note"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Note", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Note")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:visibility", entity.visibility, "xsd:string"));
    if (entity.tags != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:tags", entity.tags, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
