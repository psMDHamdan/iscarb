/**
 * TechnologyTransfer entity mapper — converts Prisma TechnologyTransfer to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface TechnologyTransferEntity {
  id: string;
  patentId: string;
  patent: string;
  institution: string;
  contactName?: string | null;
  contactEmail?: string | null;
  transferType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const technologyTransferMapper: RdfMapper<TechnologyTransferEntity> = {
  entityType: "TechnologyTransfer",
  classUri: classUri("TechnologyTransfer"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("TechnologyTransfer", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("TechnologyTransfer")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:patentId", entity.patentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:patent", entity.patent, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:institution", entity.institution, "xsd:string"));
    if (entity.contactName != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:contactName", entity.contactName, "xsd:string"));
    }
    if (entity.contactEmail != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:contactEmail", entity.contactEmail, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:transferType", entity.transferType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
