/**
 * ExperiencePoints entity mapper — converts Prisma ExperiencePoints to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ExperiencePointsEntity {
  id: string;
  studentId: string;
  points: number;
  description?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const experiencePointsMapper: RdfMapper<ExperiencePointsEntity> = {
  entityType: "ExperiencePoints",
  classUri: classUri("ExperiencePoints"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ExperiencePoints", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ExperiencePoints")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:points", entity.points, "xsd:decimal"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.entityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    }
    if (entity.entityType != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
