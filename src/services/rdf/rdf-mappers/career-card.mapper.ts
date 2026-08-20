/**
 * CareerCard entity mapper — converts Prisma CareerCard to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerCardEntity {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  employer: string;
  sector: string;
  sscoCode?: string | null;
  cluster: string;
  dayInLifeEn: string;
  dayInLifeAr: string;
  salaryRangeSAR?: string | null;
  vision2030: boolean;
  demandIndex: number;
  createdAt: Date;
  ssco?: string | null;
}

export const careerCardMapper: RdfMapper<CareerCardEntity> = {
  entityType: "CareerCard",
  classUri: classUri("CareerCard"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerCard", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerCard")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:slug", entity.slug, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleEn", entity.titleEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:employer", entity.employer, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sector", entity.sector, "xsd:string"));
    if (entity.sscoCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sscoCode", entity.sscoCode, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:cluster", entity.cluster, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dayInLifeEn", entity.dayInLifeEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:dayInLifeAr", entity.dayInLifeAr, "xsd:string"));
    if (entity.salaryRangeSAR != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:salaryRangeSAR", entity.salaryRangeSAR, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:vision2030", entity.vision2030, "xsd:boolean"));
    triples.push(rdfLiteralTriple(uri, "iscarb:demandIndex", entity.demandIndex, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    if (entity.ssco != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ssco", entity.ssco, "xsd:string"));
    }

    return { triples, graph };
  },
};
