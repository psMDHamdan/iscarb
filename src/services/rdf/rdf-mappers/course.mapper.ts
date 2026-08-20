/**
 * Course entity mapper — converts Prisma Course to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfTriple, rdfLiteralTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CourseEntity {
  id: string;
  code: string;
  name: string;
  programType?: string | null;
  nqfLevel?: string | null;
  universityId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const courseMapper: RdfMapper<CourseEntity> = {
  entityType: "Course",
  classUri: classUri("Course"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Course", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Course")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasName", entity.name, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasCourseCode", entity.code, "xsd:string"),
    ];

    if (entity.programType) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasProgramType", entity.programType, "xsd:string"));
    }
    if (entity.nqfLevel) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasNqfLevel", entity.nqfLevel, "xsd:string"));
    }
    if (entity.universityId) {
      triples.push(rdfTriple(uri, "iscarb:belongsToUniversity", instanceUri("University", universityCode, entity.universityId)));
    }
    if (entity.createdAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.updatedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));
    }

    return { graph, uri, triples };
  },

  fromTriples(triples) {
    const findVal = (p: string) => {
      const v = triples.find((t) => t.p === p)?.o;
      return typeof v === "object" ? v.value : v;
    };

    return {
      id: findVal("iscarb:hasId"),
      code: findVal("iscarb:hasCourseCode"),
      name: findVal("iscarb:hasName"),
    };
  },
};
