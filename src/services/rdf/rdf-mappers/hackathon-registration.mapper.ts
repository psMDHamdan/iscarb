/**
 * HackathonRegistration entity mapper — converts Prisma HackathonRegistration to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface HackathonRegistrationEntity {
  id: string;
  hackathonId: string;
  studentId: string;
  status: string;
  registeredAt: Date;
}

export const hackathonRegistrationMapper: RdfMapper<HackathonRegistrationEntity> = {
  entityType: "HackathonRegistration",
  classUri: classUri("HackathonRegistration"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("HackathonRegistration", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("HackathonRegistration")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:hackathonId", entity.hackathonId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:registeredAt", entity.registeredAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
