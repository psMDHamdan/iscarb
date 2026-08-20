/**
 * JobTemplate entity mapper — converts Prisma JobTemplate to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface JobTemplateEntity {
  id: string;
  employerId: string;
  title: string;
  description: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export const jobTemplateMapper: RdfMapper<JobTemplateEntity> = {
  entityType: "JobTemplate",
  classUri: classUri("JobTemplate"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("JobTemplate", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("JobTemplate")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:employerId", entity.employerId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    if (entity.salaryMin != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryMin", entity.salaryMin, "xsd:decimal"));
    }
    if (entity.salaryMax != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryMax", entity.salaryMax, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:location", entity.location, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
