/**
 * JobOpening entity mapper — converts Prisma JobOpening to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface JobOpeningEntity {
  id: string;
  employerId: string;
  employer: string;
  title: string;
  description: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  location: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const jobOpeningMapper: RdfMapper<JobOpeningEntity> = {
  entityType: "JobOpening",
  classUri: classUri("JobOpening"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("JobOpening", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("JobOpening")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:employerId", entity.employerId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:employer", entity.employer, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    if (entity.salaryMin != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryMin", entity.salaryMin, "xsd:decimal"));
    }
    if (entity.salaryMax != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryMax", entity.salaryMax, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:location", entity.location, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
