/**
 * CareerStage entity mapper — converts Prisma CareerStage to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerStageEntity {
  id: string;
  pathId: string;
  path: string;
  order: number;
  titleEn: string;
  titleAr: string;
  focusEn?: string | null;
  focusAr?: string | null;
  activitiesJson: string;
}

export const careerStageMapper: RdfMapper<CareerStageEntity> = {
  entityType: "CareerStage",
  classUri: classUri("CareerStage"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerStage", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerStage")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:pathId", entity.pathId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:path", entity.path, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleEn", entity.titleEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    if (entity.focusEn != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:focusEn", entity.focusEn, "xsd:string"));
    }
    if (entity.focusAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:focusAr", entity.focusAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:activitiesJson", entity.activitiesJson, "xsd:string"));

    return { triples, graph };
  },
};
