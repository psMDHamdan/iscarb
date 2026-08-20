/**
 * Dataset entity mapper — converts Prisma Dataset to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DatasetEntity {
  id: string;
  name: string;
  title: string;
  description: string;
  doi: string;
  fields: number;
  records: number;
  fileSize: string;
  fileFormat: string;
  accessLevel: string;
  sourceUrl?: string | null;
  documentation?: string | null;
  tags: string;
  updateFrequency: string;
  lastUpdated: Date;
  createdAt: Date;
}

export const datasetMapper: RdfMapper<DatasetEntity> = {
  entityType: "Dataset",
  classUri: classUri("Dataset"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Dataset", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Dataset")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:doi", entity.doi, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:fields", entity.fields, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:records", entity.records, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:fileSize", entity.fileSize, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:fileFormat", entity.fileFormat, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:accessLevel", entity.accessLevel, "xsd:string"));
    if (entity.sourceUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sourceUrl", entity.sourceUrl, "xsd:string"));
    }
    if (entity.documentation != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:documentation", entity.documentation, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:tags", entity.tags, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updateFrequency", entity.updateFrequency, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:lastUpdated", entity.lastUpdated.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
