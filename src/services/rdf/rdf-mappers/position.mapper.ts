/**
 * Position entity mapper — converts Prisma Position to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PositionEntity {
  id: string;
  departmentId?: string | null;
  jobTitleId: string;
  jobTitle: string;
  headcount: number;
  filled: number;
  salary?: number | null;
  status: string;
  metadata?: string | null;
}

export const positionMapper: RdfMapper<PositionEntity> = {
  entityType: "Position",
  classUri: classUri("Position"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Position", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Position")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.departmentId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:departmentId", entity.departmentId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:jobTitleId", entity.jobTitleId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:jobTitle", entity.jobTitle, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:headcount", entity.headcount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:filled", entity.filled, "xsd:decimal"));
    if (entity.salary != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salary", entity.salary, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }

    return { triples, graph };
  },
};
