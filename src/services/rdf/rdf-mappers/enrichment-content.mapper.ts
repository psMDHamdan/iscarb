/**
 * EnrichmentContent entity mapper — converts Prisma EnrichmentContent to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface EnrichmentContentEntity {
  id: string;
  cluster: string;
  specialization?: string | null;
  section: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
}

export const enrichmentContentMapper: RdfMapper<EnrichmentContentEntity> = {
  entityType: "EnrichmentContent",
  classUri: classUri("EnrichmentContent"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("EnrichmentContent", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("EnrichmentContent")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:cluster", entity.cluster, "xsd:string"));
    if (entity.specialization != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:specialization", entity.specialization, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:section", entity.section, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleEn", entity.titleEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:bodyEn", entity.bodyEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:bodyAr", entity.bodyAr, "xsd:string"));

    return { triples, graph };
  },
};
