/**
 * AdvisingSession entity mapper — converts Prisma AdvisingSession to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AdvisingSessionEntity {
  id: string;
  facultyId: string;
  studentId: string;
  sessionType: string;
  scheduledAt: Date;
  duration: number;
  notes?: string | null;
  status: string;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const advisingSessionMapper: RdfMapper<AdvisingSessionEntity> = {
  entityType: "AdvisingSession",
  classUri: classUri("AdvisingSession"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AdvisingSession", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AdvisingSession")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sessionType", entity.sessionType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:scheduledAt", entity.scheduledAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:duration", entity.duration, "xsd:decimal"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
