import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface JobOfferEntity {
  id: string;
  studentId: string;
  jobId: string;
  salary: number;
  currency: string;
  startDate: Date;
  benefits?: string | null;
  expiresAt?: Date | null;
  status: string;
  createdAt?: Date;
}

export const jobOfferMapper: RdfMapper<JobOfferEntity> = {
  entityType: "JobOffer",
  classUri: classUri("JobOffer"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("JobOffer", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("JobOffer")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfTriple(uri, "iscarb:offeredTo", instanceUri("Student", universityCode, entity.studentId)),
      rdfTriple(uri, "iscarb:forJob", instanceUri("JobPosting", universityCode, entity.jobId)),
      rdfLiteralTriple(uri, "iscarb:salary", entity.salary, "xsd:decimal"),
      rdfLiteralTriple(uri, "iscarb:currency", entity.currency, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"),
      rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"),
    ];

    if (entity.benefits) {
      triples.push(rdfLiteralTriple(uri, "iscarb:benefits", entity.benefits, "xsd:string"));
    }
    if (entity.expiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.createdAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph, uri };
  },

  fromTriples(triples) {
    return {};
  },
};
