/**
 * GraduationChecklist entity mapper — converts Prisma GraduationChecklist to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface GraduationChecklistEntity {
  id: string;
  studentId: string;
}

export const graduationChecklistMapper: RdfMapper<GraduationChecklistEntity> = {
  entityType: "GraduationChecklist",
  classUri: classUri("GraduationChecklist"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("GraduationChecklist", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("GraduationChecklist")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));

    return { triples, graph };
  },
};
