/**
 * LeaveRequest entity mapper — converts Prisma LeaveRequest to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LeaveRequestEntity {
  id: string;
  facultyId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
  status: string;
  approvedBy?: string | null;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const leaveRequestMapper: RdfMapper<LeaveRequestEntity> = {
  entityType: "LeaveRequest",
  classUri: classUri("LeaveRequest"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("LeaveRequest", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("LeaveRequest")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:leaveType", entity.leaveType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    if (entity.reason != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reason", entity.reason, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.approvedBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:approvedBy", entity.approvedBy, "xsd:string"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
