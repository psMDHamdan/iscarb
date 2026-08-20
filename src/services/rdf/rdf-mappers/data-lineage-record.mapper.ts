/**
 * DataLineageRecord entity mapper — converts Prisma DataLineageRecord to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DataLineageRecordEntity {
  id: string;
  sourceEntity: string;
  sourceId: string;
  targetEntity: string;
  targetId: string;
  relationship: string;
  transformType: string;
  lastSyncAt: Date;
  createdAt: Date;
}

export const dataLineageRecordMapper: RdfMapper<DataLineageRecordEntity> = {
  entityType: "DataLineageRecord",
  classUri: classUri("DataLineageRecord"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DataLineageRecord", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DataLineageRecord")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:sourceEntity", entity.sourceEntity, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sourceId", entity.sourceId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:targetEntity", entity.targetEntity, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:targetId", entity.targetId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:relationship", entity.relationship, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:transformType", entity.transformType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:lastSyncAt", entity.lastSyncAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
