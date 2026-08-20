/**
 * InnovationPipeline entity mapper — converts Prisma InnovationPipeline to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface InnovationPipelineEntity {
  id: string;
  ideaId: string;
  stage: string;
  enteredAt: Date;
  notes?: string | null;
  createdAt: Date;
}

export const innovationPipelineMapper: RdfMapper<InnovationPipelineEntity> = {
  entityType: "InnovationPipeline",
  classUri: classUri("InnovationPipeline"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("InnovationPipeline", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("InnovationPipeline")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:ideaId", entity.ideaId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:stage", entity.stage, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:enteredAt", entity.enteredAt.toISOString(), "xsd:dateTime"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
