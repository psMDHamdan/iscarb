/**
 * RecruiterActivity entity mapper — converts Prisma RecruiterActivity to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface RecruiterActivityEntity {
  id: string;
  recruiterId: string;
  studentId?: string | null;
  action: string;
  metadataJson?: string | null;
  createdAt: Date;
}

export const recruiterActivityMapper: RdfMapper<RecruiterActivityEntity> = {
  entityType: "RecruiterActivity",
  classUri: classUri("RecruiterActivity"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("RecruiterActivity", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("RecruiterActivity")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:recruiterId", entity.recruiterId, "xsd:string"));
    if (entity.studentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:action", entity.action, "xsd:string"));
    if (entity.metadataJson != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadataJson", entity.metadataJson, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
