/**
 * CurriculumCourse entity mapper — converts Prisma CurriculumCourse to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CurriculumCourseEntity {
  id: string;
  curriculumId: string;
  curriculum: string;
  courseId: string;
  isCore: boolean;
  credits: number;
  semester: number;
  order: number;
  createdAt: Date;
}

export const curriculumCourseMapper: RdfMapper<CurriculumCourseEntity> = {
  entityType: "CurriculumCourse",
  classUri: classUri("CurriculumCourse"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CurriculumCourse", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CurriculumCourse")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:curriculumId", entity.curriculumId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:curriculum", entity.curriculum, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:isCore", entity.isCore, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:credits", entity.credits, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:semester", entity.semester, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
