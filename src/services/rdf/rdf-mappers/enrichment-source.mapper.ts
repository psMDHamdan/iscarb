/**
 * EnrichmentSource entity mapper — converts Prisma EnrichmentSource to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface EnrichmentSourceEntity {
  id: string;
  title: string;
  sourceType: string;
  url?: string | null;
  body: string;
  cluster?: string | null;
  specialization?: string | null;
  addedBy?: string | null;
  createdAt: Date;
}

export const enrichmentSourceMapper: RdfMapper<EnrichmentSourceEntity> = {
  entityType: "EnrichmentSource",
  classUri: classUri("EnrichmentSource"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("EnrichmentSource", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("EnrichmentSource")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sourceType", entity.sourceType, "xsd:string"));
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:body", entity.body, "xsd:string"));
    if (entity.cluster != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:cluster", entity.cluster, "xsd:string"));
    }
    if (entity.specialization != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:specialization", entity.specialization, "xsd:string"));
    }
    if (entity.addedBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:addedBy", entity.addedBy, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
