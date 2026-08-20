/**
 * CertificationConcept entity mapper — converts Prisma CertificationConcept to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CertificationConceptEntity {
  id: string;
  certificationId: string;
  certification: string;
  conceptId: string;
  concept: string;
}

export const certificationConceptMapper: RdfMapper<CertificationConceptEntity> = {
  entityType: "CertificationConcept",
  classUri: classUri("CertificationConcept"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CertificationConcept", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CertificationConcept")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:certificationId", entity.certificationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:certification", entity.certification, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:conceptId", entity.conceptId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:concept", entity.concept, "xsd:string"));

    return { triples, graph };
  },
};
