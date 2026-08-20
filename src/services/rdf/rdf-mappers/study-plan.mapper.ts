/**
 * StudyPlan entity mapper — converts Prisma StudyPlan to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudyPlanEntity {
  id: string;
  studentId: string;
  title: string;
  description?: string | null;
  aiGenerated: boolean;
  status: string;
  startDate: Date;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const studyPlanMapper: RdfMapper<StudyPlanEntity> = {
  entityType: "StudyPlan",
  classUri: classUri("StudyPlan"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudyPlan", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudyPlan")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:aiGenerated", entity.aiGenerated, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    if (entity.endDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
