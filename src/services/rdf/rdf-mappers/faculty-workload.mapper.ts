/**
 * FacultyWorkload entity mapper — converts Prisma FacultyWorkload to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyWorkloadEntity {
  id: string;
  facultyId: string;
  semester: string;
  coursesCount: number;
  adviseesCount: number;
  committeeHours: number;
  researchHours: number;
  totalLoadHours: number;
  maxLoadHours: number;
  status: string;
  universityId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const facultyWorkloadMapper: RdfMapper<FacultyWorkloadEntity> = {
  entityType: "FacultyWorkload",
  classUri: classUri("FacultyWorkload"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FacultyWorkload", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FacultyWorkload")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:semester", entity.semester, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:coursesCount", entity.coursesCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:adviseesCount", entity.adviseesCount, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:committeeHours", entity.committeeHours, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:researchHours", entity.researchHours, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:totalLoadHours", entity.totalLoadHours, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:maxLoadHours", entity.maxLoadHours, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
