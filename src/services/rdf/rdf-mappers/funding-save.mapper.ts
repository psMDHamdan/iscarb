/**
 * FundingSave entity mapper — converts Prisma FundingSave to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FundingSaveEntity {
  id: string;
  studentId: string;
  programId: string;
  program: string;
  status: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const fundingSaveMapper: RdfMapper<FundingSaveEntity> = {
  entityType: "FundingSave",
  classUri: classUri("FundingSave"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FundingSave", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FundingSave")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:programId", entity.programId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:program", entity.program, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
