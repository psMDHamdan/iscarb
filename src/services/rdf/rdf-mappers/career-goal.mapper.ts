/**
 * CareerGoal entity mapper — converts Prisma CareerGoal to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerGoalEntity {
  id: string;
  studentId: string;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  category: string;
  priority: string;
  targetDate?: Date | null;
  status: string;
  progress: number;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const careerGoalMapper: RdfMapper<CareerGoalEntity> = {
  entityType: "CareerGoal",
  classUri: classUri("CareerGoal"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerGoal", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerGoal")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.titleAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    }
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.descriptionAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:descriptionAr", entity.descriptionAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:priority", entity.priority, "xsd:string"));
    if (entity.targetDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetDate", entity.targetDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:progress", entity.progress, "xsd:decimal"));
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
