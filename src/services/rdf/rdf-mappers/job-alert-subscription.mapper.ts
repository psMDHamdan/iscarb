/**
 * JobAlertSubscription entity mapper — converts Prisma JobAlertSubscription to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface JobAlertSubscriptionEntity {
  id: string;
  studentId: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  frequency: string;
  active: boolean;
  lastAlertSent?: Date | null;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const jobAlertSubscriptionMapper: RdfMapper<JobAlertSubscriptionEntity> = {
  entityType: "JobAlertSubscription",
  classUri: classUri("JobAlertSubscription"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("JobAlertSubscription", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("JobAlertSubscription")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.minSalary != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:minSalary", entity.minSalary, "xsd:decimal"));
    }
    if (entity.maxSalary != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:maxSalary", entity.maxSalary, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:frequency", entity.frequency, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:active", entity.active, "xsd:boolean"));
    if (entity.lastAlertSent) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastAlertSent", entity.lastAlertSent.toISOString(), "xsd:dateTime"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
