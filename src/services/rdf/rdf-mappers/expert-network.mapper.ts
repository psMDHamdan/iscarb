/**
 * ExpertNetwork entity mapper — converts Prisma ExpertNetwork to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ExpertNetworkEntity {
  id: string;
  userId: string;
  expertise?: string | null;
  institution?: string | null;
  orcid?: string | null;
  hIndex?: number | null;
  totalCitations?: number | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const expertNetworkMapper: RdfMapper<ExpertNetworkEntity> = {
  entityType: "ExpertNetwork",
  classUri: classUri("ExpertNetwork"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ExpertNetwork", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ExpertNetwork")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    if (entity.expertise != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expertise", entity.expertise, "xsd:string"));
    }
    if (entity.institution != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:institution", entity.institution, "xsd:string"));
    }
    if (entity.orcid != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:orcid", entity.orcid, "xsd:string"));
    }
    if (entity.hIndex != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hIndex", entity.hIndex, "xsd:decimal"));
    }
    if (entity.totalCitations != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:totalCitations", entity.totalCitations, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isAvailable", entity.isAvailable, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
