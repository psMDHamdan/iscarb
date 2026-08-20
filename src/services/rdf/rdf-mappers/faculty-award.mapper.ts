/**
 * FacultyAward entity mapper — converts Prisma FacultyAward to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FacultyAwardEntity {
  id: string;
  facultyId: string;
  title: string;
  year?: number | null;
  description?: string | null;
  category: string;
  universityId?: string | null;
  createdAt: Date;
}

export const facultyAwardMapper: RdfMapper<FacultyAwardEntity> = {
  entityType: "FacultyAward",
  classUri: classUri("FacultyAward"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FacultyAward", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FacultyAward")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:facultyId", entity.facultyId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.year != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:year", entity.year, "xsd:decimal"));
    }
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
