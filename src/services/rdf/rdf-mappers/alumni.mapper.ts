/**
 * Alumni entity mapper — converts Prisma Alumni to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AlumniEntity {
  id: string;
  userId?: string | null;
  name: string;
  nameAr?: string | null;
  email?: string | null;
  graduationYear: number;
  program: string;
  currentRole?: string | null;
  currentCompany?: string | null;
  industry?: string | null;
  location?: string | null;
  bio?: string | null;
  bioAr?: string | null;
  linkedinUrl?: string | null;
  mentorAvailable: boolean;
  successStory?: string | null;
  successStoryAr?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const alumniMapper: RdfMapper<AlumniEntity> = {
  entityType: "Alumni",
  classUri: classUri("Alumni"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Alumni", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Alumni")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    if (entity.userId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.nameAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nameAr", entity.nameAr, "xsd:string"));
    }
    if (entity.email != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:email", entity.email, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:graduationYear", entity.graduationYear, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:program", entity.program, "xsd:string"));
    if (entity.currentRole != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:currentRole", entity.currentRole, "xsd:string"));
    }
    if (entity.currentCompany != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:currentCompany", entity.currentCompany, "xsd:string"));
    }
    if (entity.industry != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:industry", entity.industry, "xsd:string"));
    }
    if (entity.location != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:location", entity.location, "xsd:string"));
    }
    if (entity.bio != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:bio", entity.bio, "xsd:string"));
    }
    if (entity.bioAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:bioAr", entity.bioAr, "xsd:string"));
    }
    if (entity.linkedinUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:linkedinUrl", entity.linkedinUrl, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:mentorAvailable", entity.mentorAvailable, "xsd:boolean"));
    if (entity.successStory != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:successStory", entity.successStory, "xsd:string"));
    }
    if (entity.successStoryAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:successStoryAr", entity.successStoryAr, "xsd:string"));
    }
    if (entity.avatarUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:avatarUrl", entity.avatarUrl, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
