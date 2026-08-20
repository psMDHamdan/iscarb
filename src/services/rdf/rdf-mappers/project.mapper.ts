/**
 * Project entity mapper — converts Prisma Project to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ProjectEntity {
  id: string;
  studentId: string;
  title: string;
  type: string;
  description: string;
  skillsJson: string;
}

export const projectMapper: RdfMapper<ProjectEntity> = {
  entityType: "Project",
  classUri: classUri("Project"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Project", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Project")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:skillsJson", entity.skillsJson, "xsd:string"));

    return { triples, graph };
  },
};
