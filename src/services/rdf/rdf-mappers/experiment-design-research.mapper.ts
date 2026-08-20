/**
 * ExperimentDesignResearch entity mapper — converts Prisma ExperimentDesignResearch to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ExperimentDesignResearchEntity {
  id: string;
  projectId: string;
  project: string;
  title: string;
  methodology: string;
  variables?: string | null;
  expectedOutcome?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const experimentDesignResearchMapper: RdfMapper<ExperimentDesignResearchEntity> = {
  entityType: "ExperimentDesignResearch",
  classUri: classUri("ExperimentDesignResearch"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ExperimentDesignResearch", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ExperimentDesignResearch")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:projectId", entity.projectId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:project", entity.project, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:methodology", entity.methodology, "xsd:string"));
    if (entity.variables != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:variables", entity.variables, "xsd:string"));
    }
    if (entity.expectedOutcome != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expectedOutcome", entity.expectedOutcome, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
