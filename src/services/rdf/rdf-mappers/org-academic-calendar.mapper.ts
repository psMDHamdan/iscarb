/**
 * OrgAcademicCalendar entity mapper — converts Prisma OrgAcademicCalendar to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OrgAcademicCalendarEntity {
  id: string;
  organizationId: string;
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const orgAcademicCalendarMapper: RdfMapper<OrgAcademicCalendarEntity> = {
  entityType: "OrgAcademicCalendar",
  classUri: classUri("OrgAcademicCalendar"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("OrgAcademicCalendar", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("OrgAcademicCalendar")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:year", entity.year, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
