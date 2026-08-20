/**
 * OntologyVersion entity mapper — converts Prisma OntologyVersion to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface OntologyVersionEntity {
  id: string;
  version: number;
  data: string;
  diff?: string | null;
  checksum: string;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: Date;
}

export const ontologyVersionMapper: RdfMapper<OntologyVersionEntity> = {
  entityType: "OntologyVersion",
  classUri: classUri("OntologyVersion"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("OntologyVersion", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("OntologyVersion")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:data", entity.data, "xsd:string"));
    if (entity.diff != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:diff", entity.diff, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:checksum", entity.checksum, "xsd:string"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    if (entity.createdBy != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:createdBy", entity.createdBy, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
