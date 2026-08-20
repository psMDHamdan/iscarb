/**
 * CareerPath entity mapper — converts Prisma CareerPath to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerPathEntity {
  id: string;
  studentId: string;
  titleEn: string;
  titleAr: string;
  targetSscoCode?: string | null;
  targetComposite: number;
  rationaleEn?: string | null;
  rationaleAr?: string | null;
  model?: string | null;
  createdAt: Date;
}

export const careerPathMapper: RdfMapper<CareerPathEntity> = {
  entityType: "CareerPath",
  classUri: classUri("CareerPath"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerPath", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerPath")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleEn", entity.titleEn, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:titleAr", entity.titleAr, "xsd:string"));
    if (entity.targetSscoCode != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetSscoCode", entity.targetSscoCode, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:targetComposite", entity.targetComposite, "xsd:decimal"));
    if (entity.rationaleEn != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rationaleEn", entity.rationaleEn, "xsd:string"));
    }
    if (entity.rationaleAr != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rationaleAr", entity.rationaleAr, "xsd:string"));
    }
    if (entity.model != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:model", entity.model, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
