/**
 * ReflectionJournal entity mapper — converts Prisma ReflectionJournal to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReflectionJournalEntity {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string | null;
  tags?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const reflectionJournalMapper: RdfMapper<ReflectionJournalEntity> = {
  entityType: "ReflectionJournal",
  classUri: classUri("ReflectionJournal"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReflectionJournal", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReflectionJournal")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    if (entity.mood != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:mood", entity.mood, "xsd:string"));
    }
    if (entity.tags != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:tags", entity.tags, "xsd:string"));
    }
    if (entity.entityType != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    }
    if (entity.entityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
