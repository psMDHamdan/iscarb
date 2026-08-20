/**
 * IntelligenceRecommendation entity mapper — converts Prisma IntelligenceRecommendation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface IntelligenceRecommendationEntity {
  id: string;
  targetType: string;
  targetId: string;
  category: string;
  title: string;
  titleAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  priority: string;
  impact: number;
  actionUrl?: string | null;
  status: string;
  dismissedAt?: Date | null;
  createdAt: Date;
}

export const intelligenceRecommendationMapper: RdfMapper<IntelligenceRecommendationEntity> = {
  entityType: "IntelligenceRecommendation",
  classUri: classUri("IntelligenceRecommendation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("IntelligenceRecommendation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("IntelligenceRecommendation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:targetType", entity.targetType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:targetId", entity.targetId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.titleAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    if (entity.descriptionAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:descriptionAr", entity.descriptionAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:priority", entity.priority, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:impact", entity.impact, "xsd:decimal"));
    if (entity.actionUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:actionUrl", entity.actionUrl, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.dismissedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:dismissedAt", entity.dismissedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
