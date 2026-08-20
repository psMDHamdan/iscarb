/**
 * DatasetAnnotation entity mapper — converts Prisma DatasetAnnotation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface DatasetAnnotationEntity {
  id: string;
  datasetId: string;
  fieldName: string;
  annotationType: string;
  value: string;
  annotatedBy: string;
  createdAt: Date;
}

export const datasetAnnotationMapper: RdfMapper<DatasetAnnotationEntity> = {
  entityType: "DatasetAnnotation",
  classUri: classUri("DatasetAnnotation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("DatasetAnnotation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("DatasetAnnotation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:datasetId", entity.datasetId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:fieldName", entity.fieldName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:annotationType", entity.annotationType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:value", entity.value, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:annotatedBy", entity.annotatedBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
