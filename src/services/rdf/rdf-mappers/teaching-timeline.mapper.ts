/**
 * TeachingTimeline entity mapper — converts Prisma TeachingTimeline to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface TeachingTimelineEntity {
  id: string;
  facultyId: string;
  courseId?: string | null;
  title: string;
  timelineType: string;
  date: Date;
  description?: string | null;
  completed: boolean;
  universityId?: string | null;
  createdAt: Date;
}

export const teachingTimelineMapper: RdfMapper<TeachingTimelineEntity> = {
  entityType: "TeachingTimeline",
  classUri: classUri("TeachingTimeline"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("TeachingTimeline", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("TeachingTimeline")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:timelineType", entity.timelineType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:date", entity.date.toISOString(), "xsd:dateTime"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:completed", entity.completed, "xsd:boolean"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
