/**
 * OnboardingTask entity mapper — converts Prisma OnboardingTask to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OnboardingTaskEntity {
  id: string;
  onboardingId: string;
  onboarding: string;
  key: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  category: string;
  ctaView?: string | null;
  order: number;
  done: boolean;
  doneAt?: Date | null;
  createdAt: Date;
}

export const onboardingTaskMapper: RdfMapper<OnboardingTaskEntity> = {
  entityType: "OnboardingTask",
  classUri: classUri("OnboardingTask"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("OnboardingTask", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("OnboardingTask")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:onboardingId", entity.onboardingId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:onboarding", entity.onboarding, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:key", entity.key, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleEn", entity.titleEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    if (entity.descriptionEn != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:descriptionEn", entity.descriptionEn, "xsd:string"));
    }
    if (entity.descriptionAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:descriptionAr", entity.descriptionAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.ctaView != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ctaView", entity.ctaView, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:done", entity.done, "xsd:boolean"));
    if (entity.doneAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:doneAt", entity.doneAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
