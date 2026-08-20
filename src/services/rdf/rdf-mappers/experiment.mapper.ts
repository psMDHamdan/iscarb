/**
 * Experiment entity mapper — converts Prisma Experiment to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ExperimentEntity {
  id: string;
  projectId: string;
  project: string;
  title: string;
  hypothesis?: string | null;
  methodology?: string | null;
  status: string;
  startDate?: Date | null;
  endDate?: Date | null;
  results?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const experimentMapper: RdfMapper<ExperimentEntity> = {
  entityType: "Experiment",
  classUri: classUri("Experiment"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Experiment", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Experiment")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:projectId", entity.projectId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:project", entity.project, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.hypothesis != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:hypothesis", entity.hypothesis, "xsd:string"));
    }
    if (entity.methodology != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:methodology", entity.methodology, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.startDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:startDate", entity.startDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.endDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endDate", entity.endDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.results != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:results", entity.results, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
