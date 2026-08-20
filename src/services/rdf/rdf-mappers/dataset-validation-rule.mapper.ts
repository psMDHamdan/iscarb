/**
 * DatasetValidationRule entity mapper — converts Prisma DatasetValidationRule to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DatasetValidationRuleEntity {
  id: string;
  datasetId: string;
  ruleType: string;
  fieldName: string;
  ruleExpression: string;
  isValid: boolean;
  lastChecked?: Date | null;
  createdAt: Date;
}

export const datasetValidationRuleMapper: RdfMapper<DatasetValidationRuleEntity> = {
  entityType: "DatasetValidationRule",
  classUri: classUri("DatasetValidationRule"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DatasetValidationRule", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DatasetValidationRule")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:datasetId", entity.datasetId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:ruleType", entity.ruleType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:fieldName", entity.fieldName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:ruleExpression", entity.ruleExpression, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isValid", entity.isValid, "xsd:boolean"));
    if (entity.lastChecked) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastChecked", entity.lastChecked.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
