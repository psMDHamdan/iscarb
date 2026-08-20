/**
 * AcademicRegulation entity mapper — converts Prisma AcademicRegulation to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AcademicRegulationEntity {
  id: string;
  organizationId: string;
  name: string;
  content?: string | null;
  category: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const academicRegulationMapper: RdfMapper<AcademicRegulationEntity> = {
  entityType: "AcademicRegulation",
  classUri: classUri("AcademicRegulation"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AcademicRegulation", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AcademicRegulation")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
