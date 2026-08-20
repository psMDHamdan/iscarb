/**
 * Hackathon entity mapper — converts Prisma Hackathon to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface HackathonEntity {
  id: string;
  slug: string;
  title: string;
  titleAr?: string | null;
  description: string;
  organizerType: string;
  organizerName: string;
  format: string;
  location?: string | null;
  registrationStart: Date;
  registrationEnd: Date;
  hackathonStart: Date;
  hackathonEnd: Date;
  judgingEnd: Date;
  prizePoolSAR: number;
  prizesJson?: string | null;
}

export const hackathonMapper: RdfMapper<HackathonEntity> = {
  entityType: "Hackathon",
  classUri: classUri("Hackathon"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Hackathon", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Hackathon")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:slug", entity.slug, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.titleAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:organizerType", entity.organizerType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:organizerName", entity.organizerName, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:format", entity.format, "xsd:string"));
    if (entity.location != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:location", entity.location, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:registrationStart", entity.registrationStart.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:registrationEnd", entity.registrationEnd.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:hackathonStart", entity.hackathonStart.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:hackathonEnd", entity.hackathonEnd.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:judgingEnd", entity.judgingEnd.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:prizePoolSAR", entity.prizePoolSAR, "xsd:decimal"));
    if (entity.prizesJson != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:prizesJson", entity.prizesJson, "xsd:string"));
    }

    return { triples, graph };
  },
};
