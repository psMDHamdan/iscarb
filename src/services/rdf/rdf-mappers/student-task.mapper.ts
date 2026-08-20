/**
 * StudentTask entity mapper — converts Prisma StudentTask to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentTaskEntity {
  id: string;
  universityId: string;
  studentId: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
  estimatedHours: number;
  actualHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export const studentTaskMapper: RdfMapper<StudentTaskEntity> = {
  entityType: "StudentTask",
  classUri: classUri("StudentTask"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentTask", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentTask")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:priority", entity.priority, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.dueDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dueDate", entity.dueDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:estimatedHours", entity.estimatedHours, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:actualHours", entity.actualHours, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
