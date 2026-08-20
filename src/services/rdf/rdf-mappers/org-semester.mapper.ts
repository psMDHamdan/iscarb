/**
 * OrgSemester entity mapper — converts Prisma OrgSemester to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OrgSemesterEntity {
  id: string;
  calendarId: string;
  calendar: string;
  name: string;
  order: number;
  startDate: Date;
  endDate: Date;
  status: string;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const orgSemesterMapper: RdfMapper<OrgSemesterEntity> = {
  entityType: "OrgSemester",
  classUri: classUri("OrgSemester"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("OrgSemester", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("OrgSemester")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:calendarId", entity.calendarId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:calendar", entity.calendar, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isCurrent", entity.isCurrent, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
