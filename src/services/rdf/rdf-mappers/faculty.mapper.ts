/**
 * Faculty entity mapper — converts Prisma Faculty to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfTriple, rdfLiteralTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyEntity {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  rank?: string | null;
  universityId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const facultyMapper: RdfMapper<FacultyEntity> = {
  entityType: "Faculty",
  classUri: classUri("Faculty"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Faculty", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Faculty")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasName", entity.name, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:hasEmail", entity.email, "xsd:string"),
    ];

    if (entity.department) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasDepartment", entity.department, "xsd:string"));
    }
    if (entity.rank) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hasRank", entity.rank, "xsd:string"));
    }
    if (entity.universityId) {
      triples.push(rdfTriple(uri, "iscarb:teachesAt", instanceUri("University", universityCode, entity.universityId)));
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
      name: findVal("iscarb:hasName"),
      email: findVal("iscarb:hasEmail"),
      department: findVal("iscarb:hasDepartment") || null,
      rank: findVal("iscarb:hasRank") || null,
    };
  },
};
