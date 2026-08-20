/**
 * AlumniConnection entity mapper — converts Prisma AlumniConnection to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AlumniConnectionEntity {
  id: string;
  alumniId: string;
  alumni: string;
  studentId: string;
  status: string;
  message?: string | null;
  connectedAt: Date;
}

export const alumniConnectionMapper: RdfMapper<AlumniConnectionEntity> = {
  entityType: "AlumniConnection",
  classUri: classUri("AlumniConnection"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AlumniConnection", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AlumniConnection")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:alumniId", entity.alumniId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:alumni", entity.alumni, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.message != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:message", entity.message, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:connectedAt", entity.connectedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
