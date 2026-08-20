/**
 * StudentAlert entity mapper — converts Prisma StudentAlert to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentAlertEntity {
  id: string;
  facultyId: string;
  studentId: string;
  alertType: string;
  severity: string;
  title: string;
  description?: string | null;
  status: string;
  actionTaken?: string | null;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const studentAlertMapper: RdfMapper<StudentAlertEntity> = {
  entityType: "StudentAlert",
  classUri: classUri("StudentAlert"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentAlert", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentAlert")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:alertType", entity.alertType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:severity", entity.severity, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.actionTaken != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:actionTaken", entity.actionTaken, "xsd:string"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
