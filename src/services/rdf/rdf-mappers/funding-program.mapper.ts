/**
 * FundingProgram entity mapper — converts Prisma FundingProgram to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface FundingProgramEntity {
  id: string;
  code: string;
  provider: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  type: string;
  stage: string;
  sector?: string | null;
  amountNote: string;
  url: string;
  active: boolean;
  createdAt: Date;
}

export const fundingProgramMapper: RdfMapper<FundingProgramEntity> = {
  entityType: "FundingProgram",
  classUri: classUri("FundingProgram"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("FundingProgram", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("FundingProgram")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:code", entity.code, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:provider", entity.provider, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:nameEn", entity.nameEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:nameAr", entity.nameAr, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:descriptionEn", entity.descriptionEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:descriptionAr", entity.descriptionAr, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:stage", entity.stage, "xsd:string"));
    if (entity.sector != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sector", entity.sector, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:amountNote", entity.amountNote, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:url", entity.url, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:active", entity.active, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
