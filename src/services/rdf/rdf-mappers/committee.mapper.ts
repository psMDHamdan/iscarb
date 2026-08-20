/**
 * Committee entity mapper — converts Prisma Committee to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CommitteeEntity {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  type: string;
  chairId?: string | null;
  memberIds?: string | null;
  meetingSchedule?: string | null;
  status: string;
  establishedDate?: Date | null;
  metadata?: string | null;
}

export const committeeMapper: RdfMapper<CommitteeEntity> = {
  entityType: "Committee",
  classUri: classUri("Committee"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Committee", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Committee")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.chairId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:chairId", entity.chairId, "xsd:string"));
    }
    if (entity.memberIds != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:memberIds", entity.memberIds, "xsd:string"));
    }
    if (entity.meetingSchedule != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:meetingSchedule", entity.meetingSchedule, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.establishedDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:establishedDate", entity.establishedDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
