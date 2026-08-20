/**
 * PipelineStage entity mapper — converts Prisma PipelineStage to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PipelineStageEntity {
  id: string;
  recruiterId: string;
  studentId: string;
  stage: string;
  notes?: string | null;
  scheduledAt?: Date | null;
  salary?: number | null;
  salaryPeriod?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const pipelineStageMapper: RdfMapper<PipelineStageEntity> = {
  entityType: "PipelineStage",
  classUri: classUri("PipelineStage"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PipelineStage", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PipelineStage")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:recruiterId", entity.recruiterId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:stage", entity.stage, "xsd:string"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    if (entity.scheduledAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:scheduledAt", entity.scheduledAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.salary != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salary", entity.salary, "xsd:decimal"));
    }
    if (entity.salaryPeriod != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryPeriod", entity.salaryPeriod, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
