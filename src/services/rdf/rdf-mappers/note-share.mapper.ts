/**
 * NoteShare entity mapper — converts Prisma NoteShare to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface NoteShareEntity {
  id: string;
  noteId: string;
  note: string;
  userId: string;
  permission: string;
  createdAt: Date;
}

export const noteShareMapper: RdfMapper<NoteShareEntity> = {
  entityType: "NoteShare",
  classUri: classUri("NoteShare"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("NoteShare", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("NoteShare")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:noteId", entity.noteId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:note", entity.note, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:permission", entity.permission, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
