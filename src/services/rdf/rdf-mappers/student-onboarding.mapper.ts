/**
 * StudentOnboarding entity mapper — converts Prisma StudentOnboarding to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentOnboardingEntity {
  id: string;
  studentId: string;
  academicYear: number;
  interests: string;
  strengths: string;
  completed: boolean;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const studentOnboardingMapper: RdfMapper<StudentOnboardingEntity> = {
  entityType: "StudentOnboarding",
  classUri: classUri("StudentOnboarding"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentOnboarding", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentOnboarding")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:academicYear", entity.academicYear, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:interests", entity.interests, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:strengths", entity.strengths, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:completed", entity.completed, "xsd:boolean"));
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
