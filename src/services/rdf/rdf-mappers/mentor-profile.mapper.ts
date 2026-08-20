/**
 * MentorProfile entity mapper — converts Prisma MentorProfile to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface MentorProfileEntity {
  id: string;
  name: string;
  employer: string;
  title: string;
  sscoCode?: string | null;
  bio?: string | null;
  available: boolean;
  createdAt: Date;
  userId?: string | null;
  authUser?: string | null;
  ssco?: string | null;
}

export const mentorProfileMapper: RdfMapper<MentorProfileEntity> = {
  entityType: "MentorProfile",
  classUri: classUri("MentorProfile"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("MentorProfile", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("MentorProfile")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:employer", entity.employer, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.sscoCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sscoCode", entity.sscoCode, "xsd:string"));
    }
    if (entity.bio != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:bio", entity.bio, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:available", entity.available, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    if (entity.userId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    }
    if (entity.authUser != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:authUser", entity.authUser, "xsd:string"));
    }
    if (entity.ssco != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ssco", entity.ssco, "xsd:string"));
    }

    return { triples, graph };
  },
};
