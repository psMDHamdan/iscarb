/**
 * ProductivitySession entity mapper — converts Prisma ProductivitySession to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ProductivitySessionEntity {
  id: string;
  universityId: string;
  studentId: string;
  sessionDate: Date;
  focusAreaId?: string | null;
  tasksCompleted: number;
  plannedTasks: number;
  actualHoursSpent: number;
  qualityScore: number;
  distractionCount: number;
  sessionType: string;
  createdAt: Date;
}

export const productivitySessionMapper: RdfMapper<ProductivitySessionEntity> = {
  entityType: "ProductivitySession",
  classUri: classUri("ProductivitySession"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ProductivitySession", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ProductivitySession")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sessionDate", entity.sessionDate.toISOString(), "xsd:dateTime"));
    if (entity.focusAreaId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:focusAreaId", entity.focusAreaId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:tasksCompleted", entity.tasksCompleted, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:plannedTasks", entity.plannedTasks, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:actualHoursSpent", entity.actualHoursSpent, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:qualityScore", entity.qualityScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:distractionCount", entity.distractionCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sessionType", entity.sessionType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
