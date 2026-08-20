/**
 * CareerProfile entity mapper — converts Prisma CareerProfile to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerProfileEntity {
  id: string;
  studentId: string;
  headline?: string | null;
  bio?: string | null;
  locationPref?: string | null;
  salaryExpectMin?: number | null;
  salaryExpectMax?: number | null;
  workTypePref: string;
  openToRemote: boolean;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  websiteUrl?: string | null;
  digitalCvHtml?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const careerProfileMapper: RdfMapper<CareerProfileEntity> = {
  entityType: "CareerProfile",
  classUri: classUri("CareerProfile"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerProfile", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerProfile")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.headline != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:headline", entity.headline, "xsd:string"));
    }
    if (entity.bio != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:bio", entity.bio, "xsd:string"));
    }
    if (entity.locationPref != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:locationPref", entity.locationPref, "xsd:string"));
    }
    if (entity.salaryExpectMin != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryExpectMin", entity.salaryExpectMin, "xsd:decimal"));
    }
    if (entity.salaryExpectMax != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryExpectMax", entity.salaryExpectMax, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:workTypePref", entity.workTypePref, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:openToRemote", entity.openToRemote, "xsd:boolean"));
    if (entity.linkedinUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:linkedinUrl", entity.linkedinUrl, "xsd:string"));
    }
    if (entity.portfolioUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:portfolioUrl", entity.portfolioUrl, "xsd:string"));
    }
    if (entity.websiteUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:websiteUrl", entity.websiteUrl, "xsd:string"));
    }
    if (entity.digitalCvHtml != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:digitalCvHtml", entity.digitalCvHtml, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
