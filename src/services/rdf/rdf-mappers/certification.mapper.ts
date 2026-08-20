/**
 * Certification entity mapper — converts Prisma Certification to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CertificationEntity {
  id: string;
  name: string;
  provider: string;
  level: string;
  cluster: string;
  url?: string | null;
  costNote?: string | null;
  createdAt: Date;
}

export const certificationMapper: RdfMapper<CertificationEntity> = {
  entityType: "Certification",
  classUri: classUri("Certification"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Certification", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Certification")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:provider", entity.provider, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:level", entity.level, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:cluster", entity.cluster, "xsd:string"));
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    if (entity.costNote != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:costNote", entity.costNote, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
