/**
 * DatasetVersion entity mapper — converts Prisma DatasetVersion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DatasetVersionEntity {
  id: string;
  datasetId: string;
  version: number;
  description?: string | null;
  filePath?: string | null;
  size?: number | null;
  createdAt: Date;
}

export const datasetVersionMapper: RdfMapper<DatasetVersionEntity> = {
  entityType: "DatasetVersion",
  classUri: classUri("DatasetVersion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DatasetVersion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DatasetVersion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:datasetId", entity.datasetId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:decimal"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    if (entity.filePath != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:filePath", entity.filePath, "xsd:string"));
    }
    if (entity.size != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:size", entity.size, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
