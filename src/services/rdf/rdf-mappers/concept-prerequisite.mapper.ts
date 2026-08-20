/**
 * ConceptPrerequisite entity mapper — converts Prisma ConceptPrerequisite to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ConceptPrerequisiteEntity {
  id: string;
  conceptId: string;
  concept: string;
  dependsOnId: string;
  dependsOn: string;
}

export const conceptPrerequisiteMapper: RdfMapper<ConceptPrerequisiteEntity> = {
  entityType: "ConceptPrerequisite",
  classUri: classUri("ConceptPrerequisite"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ConceptPrerequisite", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ConceptPrerequisite")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:conceptId", entity.conceptId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:concept", entity.concept, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dependsOnId", entity.dependsOnId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dependsOn", entity.dependsOn, "xsd:string"));

    return { triples, graph };
  },
};
