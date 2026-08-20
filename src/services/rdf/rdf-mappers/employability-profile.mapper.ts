/**
 * EmployabilityProfile entity mapper — converts Prisma EmployabilityProfile to RDF triples.
 * Maps to the iscarb:EmployabilityProfile class with composite score, band, and dimension data.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfTriple, rdfLiteralTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface EmployabilityProfileEntity {
  id: string;
  studentId: string;
  specialization?: string | null;
  composite: number;
  band: string;
  passed: boolean;
  dimensionsJson: string;
  coveredJson: string;
  computedAt?: Date;
}

export const employabilityProfileMapper: RdfMapper<EmployabilityProfileEntity> = {
  entityType: "EmployabilityProfile",
  classUri: classUri("EmployabilityProfile"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("EmployabilityProfile", universityCode, entity.id);
    const graph = universityGraph(universityCode);
    const studentUri = instanceUri("Student", universityCode, entity.studentId);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("EmployabilityProfile")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:composite", entity.composite, "xsd:decimal"),
      rdfLiteralTriple(uri, "iscarb:band", entity.band, "xsd:string"),
      rdfLiteralTriple(uri, "iscarb:passed", entity.passed, "xsd:boolean"),
      // Link to student
      rdfTriple(uri, "iscarb:profileOf", studentUri),
      rdfTriple(studentUri, "iscarb:hasEmployabilityProfile", uri),
    ];

    if (entity.specialization) {
      triples.push(rdfLiteralTriple(uri, "iscarb:specialization", entity.specialization, "xsd:string"));
    }
    if (entity.computedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:computedAt", entity.computedAt.toISOString(), "xsd:dateTime"));
    }

    // Parse dimension scores
    try {
      const dimensions = JSON.parse(entity.dimensionsJson) as Array<{
        dimension: string;
        score: number;
        weight: number;
        responseCount: number;
      }>;
      for (const d of dimensions) {
        const dimUri = `${uri}/dimension/${encodeURIComponent(d.dimension)}`;
        triples.push(
          rdfTriple(uri, "iscarb:hasDimensionScore", dimUri),
          rdfTriple(dimUri, "rdf:type", classUri("DimensionScore")),
          rdfLiteralTriple(dimUri, "iscarb:dimension", d.dimension, "xsd:string"),
          rdfLiteralTriple(dimUri, "iscarb:score", d.score, "xsd:decimal"),
          rdfLiteralTriple(dimUri, "iscarb:weight", d.weight, "xsd:decimal"),
          rdfLiteralTriple(dimUri, "iscarb:responseCount", d.responseCount, "xsd:integer"),
        );
      }
    } catch {
      triples.push(rdfLiteralTriple(uri, "iscarb:dimensionsJson", entity.dimensionsJson, "xsd:string"));
    }

    // Parse covered dimensions
    try {
      const covered = JSON.parse(entity.coveredJson) as string[];
      for (const c of covered) {
        triples.push(rdfLiteralTriple(uri, "iscarb:coversDimension", c, "xsd:string"));
      }
    } catch { /* skip */ }

    return { graph, uri, triples };
  },

  fromTriples(triples) {
    const findVal = (p: string) => {
      const v = triples.find((t) => t.p === p)?.o;
      return typeof v === "object" ? v.value : v;
    };

    return {
      id: findVal("iscarb:hasId"),
      composite: parseFloat(findVal("iscarb:composite") || "0"),
      band: findVal("iscarb:band"),
      passed: findVal("iscarb:passed") === "true",
      specialization: findVal("iscarb:specialization") || null,
    };
  },
};
