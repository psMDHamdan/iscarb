/**
 * Procedure entity mapper — converts Prisma Procedure to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ProcedureEntity {
  id: string;
  policyId: string;
  policy: string;
  title: string;
  version: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const procedureMapper: RdfMapper<ProcedureEntity> = {
  entityType: "Procedure",
  classUri: classUri("Procedure"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Procedure", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Procedure")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:policyId", entity.policyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:policy", entity.policy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
