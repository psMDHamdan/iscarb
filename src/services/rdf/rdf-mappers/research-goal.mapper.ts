/**
 * ResearchGoal entity mapper — converts Prisma ResearchGoal to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchGoalEntity {
  id: string;
  projectId: string;
  project: string;
  title: string;
  description?: string | null;
  targetDate?: Date | null;
  status: string;
  metric?: string | null;
  createdAt: Date;
}

export const researchGoalMapper: RdfMapper<ResearchGoalEntity> = {
  entityType: "ResearchGoal",
  classUri: classUri("ResearchGoal"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchGoal", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchGoal")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:projectId", entity.projectId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:project", entity.project, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.targetDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetDate", entity.targetDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.metric != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metric", entity.metric, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
