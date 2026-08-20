/**
 * DegreeRequirement entity mapper — converts Prisma DegreeRequirement to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DegreeRequirementEntity {
  id: string;
  programId: string;
  type: string;
  credits: number;
  description?: string | null;
  createdAt: Date;
}

export const degreeRequirementMapper: RdfMapper<DegreeRequirementEntity> = {
  entityType: "DegreeRequirement",
  classUri: classUri("DegreeRequirement"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DegreeRequirement", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DegreeRequirement")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:programId", entity.programId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:credits", entity.credits, "xsd:decimal"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
