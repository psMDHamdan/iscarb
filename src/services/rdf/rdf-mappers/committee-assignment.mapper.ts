/**
 * CommitteeAssignment entity mapper — converts Prisma CommitteeAssignment to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CommitteeAssignmentEntity {
  id: string;
  facultyId: string;
  committeeName: string;
  role: string;
  startDate?: Date | null;
  endDate?: Date | null;
  universityId?: string | null;
  createdAt: Date;
}

export const committeeAssignmentMapper: RdfMapper<CommitteeAssignmentEntity> = {
  entityType: "CommitteeAssignment",
  classUri: classUri("CommitteeAssignment"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CommitteeAssignment", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CommitteeAssignment")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:committeeName", entity.committeeName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:role", entity.role, "xsd:string"));
    if (entity.startDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.endDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
