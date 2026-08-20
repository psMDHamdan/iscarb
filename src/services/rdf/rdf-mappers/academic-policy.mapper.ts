/**
 * AcademicPolicy entity mapper — converts Prisma AcademicPolicy to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AcademicPolicyEntity {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  content?: string | null;
  status: string;
  effectiveDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const academicPolicyMapper: RdfMapper<AcademicPolicyEntity> = {
  entityType: "AcademicPolicy",
  classUri: classUri("AcademicPolicy"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AcademicPolicy", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AcademicPolicy")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.effectiveDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:effectiveDate", entity.effectiveDate.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
