/**
 * Portfolio entity mapper — converts Prisma Portfolio to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface PortfolioEntity {
  id: string;
  studentId: string;
  visibility: string;
  headline?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  bannerImage?: string | null;
  shareToken?: string | null;
  shareExpiresAt?: Date | null;
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  aiGeneratedDescription?: string | null;
  skillsExtracted?: string | null;
  projectImpact?: string | null;
  careerProfile?: string | null;
}

export const portfolioMapper: RdfMapper<PortfolioEntity> = {
  entityType: "Portfolio",
  classUri: classUri("Portfolio"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Portfolio", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Portfolio")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:visibility", entity.visibility, "xsd:string"));
    if (entity.headline != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:headline", entity.headline, "xsd:string"));
    }
    if (entity.bio != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:bio", entity.bio, "xsd:string"));
    }
    if (entity.profileImage != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:profileImage", entity.profileImage, "xsd:string"));
    }
    if (entity.bannerImage != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:bannerImage", entity.bannerImage, "xsd:string"));
    }
    if (entity.shareToken != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:shareToken", entity.shareToken, "xsd:string"));
    }
    if (entity.shareExpiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:shareExpiresAt", entity.shareExpiresAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:isPublished", entity.isPublished, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:viewCount", entity.viewCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    if (entity.aiGeneratedDescription != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:aiGeneratedDescription", entity.aiGeneratedDescription, "xsd:string"));
    }
    if (entity.skillsExtracted != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:skillsExtracted", entity.skillsExtracted, "xsd:string"));
    }
    if (entity.projectImpact != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:projectImpact", entity.projectImpact, "xsd:string"));
    }
    if (entity.careerProfile != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:careerProfile", entity.careerProfile, "xsd:string"));
    }

    return { triples, graph };
  },
};
