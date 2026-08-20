/**
 * TalentPool entity mapper — converts Prisma TalentPool to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface TalentPoolEntity {
  id: string;
  recruiterId: string;
  name: string;
  description?: string | null;
  isAuto: boolean;
  autoRule?: string | null;
}

export const talentPoolMapper: RdfMapper<TalentPoolEntity> = {
  entityType: "TalentPool",
  classUri: classUri("TalentPool"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("TalentPool", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("TalentPool")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:recruiterId", entity.recruiterId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isAuto", entity.isAuto, "xsd:boolean"));
    if (entity.autoRule != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:autoRule", entity.autoRule, "xsd:string"));
    }

    return { triples, graph };
  },
};
