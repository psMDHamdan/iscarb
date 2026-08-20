/**
 * CapstoneProject entity mapper — converts Prisma CapstoneProject to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CapstoneProjectEntity {
  id: string;
  universityId: string;
  studentId: string;
  title: string;
  description?: string | null;
  focusArea?: string | null;
  status: string;
  startDate: Date;
  targetCompletionDate?: Date | null;
  completedAt?: Date | null;
  mentorId?: string | null;
  milestones: string;
}

export const capstoneProjectMapper: RdfMapper<CapstoneProjectEntity> = {
  entityType: "CapstoneProject",
  classUri: classUri("CapstoneProject"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CapstoneProject", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CapstoneProject")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.focusArea != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:focusArea", entity.focusArea, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    if (entity.targetCompletionDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetCompletionDate", entity.targetCompletionDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.mentorId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:mentorId", entity.mentorId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:milestones", entity.milestones, "xsd:string"));

    return { triples, graph };
  },
};
