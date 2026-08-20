/**
 * FacultyTraining entity mapper — converts Prisma FacultyTraining to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyTrainingEntity {
  id: string;
  facultyId: string;
  title: string;
  category: string;
  provider?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  hours?: number | null;
  status: string;
  certificate?: string | null;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const facultyTrainingMapper: RdfMapper<FacultyTrainingEntity> = {
  entityType: "FacultyTraining",
  classUri: classUri("FacultyTraining"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FacultyTraining", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FacultyTraining")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.provider != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:provider", entity.provider, "xsd:string"));
    }
    if (entity.startDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.endDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.hours != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hours", entity.hours, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.certificate != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:certificate", entity.certificate, "xsd:string"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
