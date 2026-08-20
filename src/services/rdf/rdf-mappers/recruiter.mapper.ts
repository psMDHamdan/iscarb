/**
 * Recruiter entity mapper — converts Prisma Recruiter to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface RecruiterEntity {
  id: string;
  userId: string;
  name: string;
  email: string;
  employer: string;
  employerLogo?: string | null;
  title?: string | null;
  verified: boolean;
  createdAt: Date;
}

export const recruiterMapper: RdfMapper<RecruiterEntity> = {
  entityType: "Recruiter",
  classUri: classUri("Recruiter"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Recruiter", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Recruiter")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:email", entity.email, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:employer", entity.employer, "xsd:string"));
    if (entity.employerLogo != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:employerLogo", entity.employerLogo, "xsd:string"));
    }
    if (entity.title != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:verified", entity.verified, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
