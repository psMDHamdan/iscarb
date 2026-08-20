import { db } from "@/lib/db";
import { normalizeScoringSource } from "@/lib/assessment/scoring-source";

export const ISCARB_NS = "https://iscarb.sa/ns/assessment#";
export const SKOS_NS = "http://www.w3.org/2004/02/skos/core#";
export const XSD_NS = "http://www.w3.org/2001/XMLSchema#";

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Maps a relational student employability profile and assessment responses
 * into a JSON-LD RDF representation exactly as defined in BRD V1.4 Appendix F.2
 *
 * NOTE: Live score-write sync uses services/rdf/rdf-mappers/assessment-response.mapper.ts
 * via rdfSyncService. This mapper feeds graph/full JSON-LD read routes
 * (assessment/graph, rdf/student/[id]/full). Keep scoringSource in sync with ontology.
 */
export async function studentToJSONLD(studentIdentifier: string, baseUrl: string) {
  let student = await db.student.findUnique({
    where: { id: studentIdentifier },
    include: {
      employabilityProfile: true,
      assessmentResponses: { where: { isCurrent: true } },
    },
  });

  if (!student) {
    student = await db.student.findFirst({
      where: { name: { equals: studentIdentifier, mode: "insensitive" } },
      include: {
        employabilityProfile: true,
        assessmentResponses: { where: { isCurrent: true } },
      },
    });
  }

  if (!student || !student.employabilityProfile) return null;

  const profile = student.employabilityProfile;
  const responses = student.assessmentResponses;

  // The BRD specifies dimensions as flat properties on the student node
  let dims: any = {};
  if (profile.dimensionsJson) {
    try {
      dims = JSON.parse(profile.dimensionsJson);
    } catch (e) {}
  }

  const context = {
    iscarb: ISCARB_NS,
    skos: SKOS_NS,
    xsd: XSD_NS,
    Student: "iscarb:Student",
    AssessmentResponse: "iscarb:AssessmentResponse",
    specialization: "iscarb:specialization",
    jobFitSource: { "@id": "iscarb:jobFitSource", "@type": "@vocab" },
    composite: { "@id": "iscarb:composite", "@type": "xsd:float" },
    band: { "@id": "iscarb:band", "@type": "@vocab" },
    passed: { "@id": "iscarb:passed", "@type": "xsd:boolean" },
    readinessScore: { "@id": "iscarb:readinessScore", "@type": "xsd:float" },
    computedAt: { "@id": "iscarb:computedAt", "@type": "xsd:dateTime" },
    hasResponse: { "@id": "iscarb:hasResponse", "@type": "@id" },

    // Response properties
    module: { "@id": "iscarb:module", "@type": "@id" },
    dimension: { "@id": "iscarb:dimension", "@type": "@vocab" },
    score: { "@id": "iscarb:score", "@type": "xsd:float" },
    rawResponse: "iscarb:rawResponse",
    feedback: "iscarb:feedback",
    scoringSource: { "@id": "iscarb:scoringSource", "@type": "@vocab" },
    model: "iscarb:model",
    latencyMs: { "@id": "iscarb:latencyMs", "@type": "xsd:integer" },
    submittedAt: { "@id": "iscarb:submittedAt", "@type": "xsd:dateTime" },
    hasCriterionScore: "iscarb:hasCriterionScore",
    criterion: { "@id": "iscarb:criterion", "@type": "@id" },
    value: { "@id": "iscarb:value", "@type": "xsd:float" },
    hasName: "iscarb:hasName",
  };

  const jsonld: any = {
    "@context": context,
    "@id": `${baseUrl}/api/rdf/student/${encodeURIComponent(student.id)}`,
    "@type": "Student",
    hasName: student.name,
    specialization: profile.specialization || student.program || "General",
    composite: profile.composite,
    band: `iscarb:${profile.band.replace(/\s+/g, "")}`,
    passed: profile.passed,
    readinessScore: profile.composite,
    computedAt: profile.computedAt.toISOString(),
  };

  if (dims.core_professionalism !== undefined) jsonld["iscarb:coreProfessionalism"] = dims.core_professionalism;
  if (dims.business_digital !== undefined) jsonld["iscarb:businessDigital"] = dims.business_digital;
  if (dims.job_fit !== undefined) jsonld["iscarb:jobFit"] = dims.job_fit;
  if (dims.growth_potential !== undefined) jsonld["iscarb:growthPotential"] = dims.growth_potential;

  if (responses.length > 0) {
    jsonld["hasResponse"] = responses.map((r) => {
      let critScores: unknown[] = [];
      try {
        const parsed = JSON.parse(r.perCriterionJson);
        critScores = Object.entries(parsed).map(([critId, val]) => ({
          "@type": "_:CriterionScore",
          criterion: `${baseUrl}/api/rdf/criterion/${critId}`,
          value: val,
          hasName: `Criterion Score: ${val}`,
        }));
      } catch (e) {}

      const scoringSource = normalizeScoringSource(r.source);

      return {
        "@id": `${baseUrl}/api/rdf/response/${r.id}`,
        "@type": "AssessmentResponse",
        hasName: `Response: ${r.dimension} (${r.score})`,
        module: `${baseUrl}/api/rdf/module/${r.moduleCode}`,
        dimension: `iscarb:${toCamelCase(r.dimension)}`,
        score: r.score,
        band: `iscarb:${r.band.replace(/\s+/g, "")}`,
        passed: r.passed,
        rawResponse: (r as { rawResponse?: string | null }).rawResponse || "",
        feedback: r.feedback,
        scoringSource: `iscarb:${scoringSource}`,
        model: r.model || "openai/gpt-oss-20b",
        latencyMs: r.latencyMs || 0,
        submittedAt: r.createdAt.toISOString(),
        hasCriterionScore: critScores,
      };
    });
  }

  return jsonld;
}
