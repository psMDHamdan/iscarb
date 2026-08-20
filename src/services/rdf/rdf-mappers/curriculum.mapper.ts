/**
 * Curriculum entity mapper — converts Prisma Curriculum to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CurriculumEntity {
  id: string;
  programId: string;
  name: string;
  description?: string | null;
  version: string;
  status: string;
  approvalStatus: string;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const curriculumMapper: RdfMapper<CurriculumEntity> = {
  entityType: "Curriculum",
  classUri: classUri("Curriculum"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Curriculum", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Curriculum")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:programId", entity.programId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:approvalStatus", entity.approvalStatus, "xsd:string"));
    if (entity.approvedBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:approvedBy", entity.approvedBy, "xsd:string"));
    }
    if (entity.approvedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:approvedAt", entity.approvedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
