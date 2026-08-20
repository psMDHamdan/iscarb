/**
 * PeerLearningGroup entity mapper — converts Prisma PeerLearningGroup to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PeerLearningGroupEntity {
  id: string;
  name: string;
  description?: string | null;
  courseId?: string | null;
  maxMembers: number;
  createdBy: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const peerLearningGroupMapper: RdfMapper<PeerLearningGroupEntity> = {
  entityType: "PeerLearningGroup",
  classUri: classUri("PeerLearningGroup"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("PeerLearningGroup", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("PeerLearningGroup")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:maxMembers", entity.maxMembers, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
