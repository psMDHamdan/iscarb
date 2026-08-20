/**
 * ResearchDataset entity mapper — converts Prisma ResearchDataset to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResearchDatasetEntity {
  id: string;
  name: string;
  description?: string | null;
  format: string;
  size?: string | null;
  authorId: string;
  organizationId?: string | null;
  license?: string | null;
  url?: string | null;
  metadata?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const researchDatasetMapper: RdfMapper<ResearchDatasetEntity> = {
  entityType: "ResearchDataset",
  classUri: classUri("ResearchDataset"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResearchDataset", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResearchDataset")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:format", entity.format, "xsd:string"));
    if (entity.size != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:size", entity.size, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    if (entity.license != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:license", entity.license, "xsd:string"));
    }
    if (entity.url != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
