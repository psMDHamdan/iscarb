/**
 * ReferenceListItem entity mapper — converts Prisma ReferenceListItem to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ReferenceListItemEntity {
  id: string;
  publicationId: string;
  publication: string;
  referenceText: string;
  format: string;
  order: number;
  createdAt: Date;
}

export const referenceListItemMapper: RdfMapper<ReferenceListItemEntity> = {
  entityType: "ReferenceListItem",
  classUri: classUri("ReferenceListItem"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ReferenceListItem", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ReferenceListItem")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:publicationId", entity.publicationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:publication", entity.publication, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:referenceText", entity.referenceText, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:format", entity.format, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:order", entity.order, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
