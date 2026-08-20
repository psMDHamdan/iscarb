/**
 * DatasetAccess entity mapper — converts Prisma DatasetAccess to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DatasetAccessEntity {
  id: string;
  datasetId: string;
  dataset: string;
  requestId?: string | null;
  accessedAt: Date;
  expiresAt?: Date | null;
  downloadCount: number;
}

export const datasetAccessMapper: RdfMapper<DatasetAccessEntity> = {
  entityType: "DatasetAccess",
  classUri: classUri("DatasetAccess"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DatasetAccess", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DatasetAccess")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:datasetId", entity.datasetId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dataset", entity.dataset, "xsd:string"));
    if (entity.requestId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:requestId", entity.requestId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:accessedAt", entity.accessedAt.toISOString(), "xsd:dateTime"));
    if (entity.expiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:downloadCount", entity.downloadCount, "xsd:decimal"));

    return { triples, graph };
  },
};
