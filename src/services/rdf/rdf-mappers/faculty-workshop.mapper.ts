/**
 * FacultyWorkshop entity mapper — converts Prisma FacultyWorkshop to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyWorkshopEntity {
  id: string;
  facultyId: string;
  title: string;
  workshopType: string;
  date?: Date | null;
  hours?: number | null;
  certificate?: string | null;
  universityId?: string | null;
  createdAt: Date;
}

export const facultyWorkshopMapper: RdfMapper<FacultyWorkshopEntity> = {
  entityType: "FacultyWorkshop",
  classUri: classUri("FacultyWorkshop"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FacultyWorkshop", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FacultyWorkshop")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:workshopType", entity.workshopType, "xsd:string"));
    if (entity.date) {
      triples.push(rdfLiteralTriple(uri, "iscarb:date", entity.date.toISOString(), "xsd:dateTime"));
    }
    if (entity.hours != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hours", entity.hours, "xsd:decimal"));
    }
    if (entity.certificate != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:certificate", entity.certificate, "xsd:string"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
