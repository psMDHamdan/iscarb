/**
 * CareerMapping entity mapper — converts Prisma CareerMapping to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerMappingEntity {
  id: string;
  studentId: string;
  generatedTitle: string;
  titleAr?: string | null;
  cluster: string;
  sscoCode?: string | null;
  ssco?: string | null;
  iscoMajorGroup?: string | null;
  alignment: string;
  matchScore: number;
  skillsEvidence: string;
  createdAt: Date;
}

export const careerMappingMapper: RdfMapper<CareerMappingEntity> = {
  entityType: "CareerMapping",
  classUri: classUri("CareerMapping"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerMapping", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerMapping")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:generatedTitle", entity.generatedTitle, "xsd:string"));
    if (entity.titleAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:cluster", entity.cluster, "xsd:string"));
    if (entity.sscoCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sscoCode", entity.sscoCode, "xsd:string"));
    }
    if (entity.ssco != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ssco", entity.ssco, "xsd:string"));
    }
    if (entity.iscoMajorGroup != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:iscoMajorGroup", entity.iscoMajorGroup, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:alignment", entity.alignment, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:matchScore", entity.matchScore, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:skillsEvidence", entity.skillsEvidence, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
