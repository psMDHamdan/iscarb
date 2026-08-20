/**
 * ComplianceCheck entity mapper — converts Prisma ComplianceCheck to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ComplianceCheckEntity {
  id: string;
  checkName: string;
  category: string;
  status: string;
  message?: string | null;
  evidence?: string | null;
  lastChecked: Date;
  nextCheck?: Date | null;
}

export const complianceCheckMapper: RdfMapper<ComplianceCheckEntity> = {
  entityType: "ComplianceCheck",
  classUri: classUri("ComplianceCheck"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ComplianceCheck", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ComplianceCheck")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:checkName", entity.checkName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:category", entity.category, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.message != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:message", entity.message, "xsd:string"));
    }
    if (entity.evidence != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:evidence", entity.evidence, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:lastChecked", entity.lastChecked.toISOString(), "xsd:dateTime"));
    if (entity.nextCheck) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nextCheck", entity.nextCheck.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
