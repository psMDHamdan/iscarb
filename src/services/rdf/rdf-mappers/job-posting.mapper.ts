/**
 * JobPosting entity mapper — converts Prisma JobPosting to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface JobPostingEntity {
  id: string;
  title: string;
  titleAr?: string | null;
  employer: string;
  sector: string;
  sscoCode?: string | null;
  minComposite: number;
  vision2030: boolean;
  location?: string | null;
  externalId?: string | null;
  postedAt: Date;
  recruiterId?: string | null;
  ssco?: string | null;
}

export const jobPostingMapper: RdfMapper<JobPostingEntity> = {
  entityType: "JobPosting",
  classUri: classUri("JobPosting"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("JobPosting", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("JobPosting")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.titleAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:employer", entity.employer, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sector", entity.sector, "xsd:string"));
    if (entity.sscoCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sscoCode", entity.sscoCode, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:minComposite", entity.minComposite, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:vision2030", entity.vision2030, "xsd:boolean"));
    if (entity.location != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:location", entity.location, "xsd:string"));
    }
    if (entity.externalId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:externalId", entity.externalId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:postedAt", entity.postedAt.toISOString(), "xsd:dateTime"));
    if (entity.recruiterId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:recruiterId", entity.recruiterId, "xsd:string"));
    }
    if (entity.ssco != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ssco", entity.ssco, "xsd:string"));
    }

    return { triples, graph };
  },
};
