/**
 * HabitCompletion entity mapper — converts Prisma HabitCompletion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface HabitCompletionEntity {
  id: string;
  habitId: string;
  habit: string;
  completedAt: Date;
  notes?: string | null;
}

export const habitCompletionMapper: RdfMapper<HabitCompletionEntity> = {
  entityType: "HabitCompletion",
  classUri: classUri("HabitCompletion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("HabitCompletion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("HabitCompletion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:habitId", entity.habitId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:habit", entity.habit, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }

    return { triples, graph };
  },
};
