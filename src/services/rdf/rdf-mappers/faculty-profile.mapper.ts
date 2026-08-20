/**
 * FacultyProfile entity mapper — converts Prisma FacultyProfile to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyProfileEntity {
  id: string;
  facultyId: string;
  userId?: string | null;
  authUser?: string | null;
  universityId?: string | null;
  title?: string | null;
  bio?: string | null;
  officeHours?: string | null;
  officeLocation?: string | null;
  preferencesJson: string;
}

export const facultyProfileMapper: RdfMapper<FacultyProfileEntity> = {
  entityType: "FacultyProfile",
  classUri: classUri("FacultyProfile"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FacultyProfile", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FacultyProfile")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    if (entity.userId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    }
    if (entity.authUser != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:authUser", entity.authUser, "xsd:string"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    if (entity.title != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    }
    if (entity.bio != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:bio", entity.bio, "xsd:string"));
    }
    if (entity.officeHours != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:officeHours", entity.officeHours, "xsd:string"));
    }
    if (entity.officeLocation != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:officeLocation", entity.officeLocation, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:preferencesJson", entity.preferencesJson, "xsd:string"));

    return { triples, graph };
  },
};
