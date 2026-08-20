import { db } from '@/lib/db';
import { kgClient } from './client';
import { normalizeScoringSource } from '@/lib/assessment/scoring-source';

const BAND_BASE = 'https://iscarb.edu/ontology/assessment/band';
const SOURCE_BASE = 'https://iscarb.edu/ontology/assessment/scoringSource';

function bandConcept(band: string) {
  const slug = String(band).trim().replace(/\s+/g, '');
  const label = String(band);
  return {
    '@id': `${BAND_BASE}/${encodeURIComponent(slug)}`,
    '@type': 'iscarb:Band',
    'rdfs:label': label,
  };
}

function sourceConcept(source: string) {
  const slug = normalizeScoringSource(source);
  return {
    '@id': `${SOURCE_BASE}/${encodeURIComponent(slug)}`,
    '@type': 'iscarb:ScoringSource',
    'rdfs:label': slug,
  };
}

export class JsonLdEngine {
  private baseContext = {
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "iscarb": "https://iscarb.edu/ontology/",
    "iscarb-core": "https://iscarb.edu/ontology/core/",
    "iscarb-student": "https://iscarb.edu/ontology/student/",
    "iscarb-learning": "https://iscarb.edu/ontology/learning/",
    "iscarb-assessment": "https://iscarb.edu/ontology/assessment/",
    "iscarb-career": "https://iscarb.edu/ontology/career/",
    "iscarb-ai": "https://iscarb.edu/ontology/ai/",
    "iscarb-competency": "https://iscarb.edu/ontology/competency/",
    "iscarb-finance": "https://iscarb.edu/ontology/finance/",
  };

  /**
   * Recursively formats an object into JSON-LD
   */
  private formatValue(value: any, key: string, parentDomain: string): any {
    if (value === null || value === undefined) {
      return undefined; // omit empty fields — keeps professor-facing JSON readable
    }
    if (value instanceof Date) {
      return {
        "@type": "xsd:dateTime",
        "@value": value.toISOString()
      };
    }
    if (Array.isArray(value)) {
      return value.map(v => this.formatValue(v, key, parentDomain)).filter(v => v !== undefined);
    }
    if (typeof value === 'object' && value !== null) {
      if (value.id) {
        const typeName = key.replace(/s$/, ''); // Basic singularization
        const payload: any = {
          "@id": `https://iscarb.edu/ontology/${parentDomain}/${typeName.toLowerCase()}/${value.id}`,
          "@type": typeName,
        };
        for (const [k, v] of Object.entries(value)) {
          if (k === 'id') continue;
          if (v === null || v === undefined) continue;
          
          // BRD Mapping for AssessmentResponse fields
          if (typeName.toLowerCase() === 'assessmentresponse') {
            if (k === 'perCriterionJson' && typeof v === 'string') {
              try {
                const criteria = JSON.parse(v);
                payload['iscarb:hasCriterionScore'] = criteria.map((c: any) => ({
                  "@type": "iscarb:CriterionScore",
                  "iscarb:criterion": `https://iscarb.edu/ontology/assessment/criterion/${c.criterionId}`,
                  "iscarb:value": c.score
                }));
                continue;
              } catch (e) {
                // Ignore parse errors, fallback to string
              }
            }
            if (k === 'band' && typeof v === 'string') {
              payload['iscarb:band'] = bandConcept(v);
              continue;
            }
            if (k === 'source' && typeof v === 'string') {
              payload['iscarb:scoringSource'] = sourceConcept(v);
              continue;
            }
            if (k === 'rawResponse') {
              payload['iscarb:rawResponse'] = v; // DR-01 explicit BRD predicate
              payload['rawResponse'] = v; // keep plain key for UI/tools
              continue;
            }
            if (k === 'isCurrent') {
              payload['iscarb:isCurrent'] = v;
              continue;
            }
            if (k === 'createdAt') {
              payload['iscarb:timestamp'] = {
                '@type': 'xsd:dateTime',
                '@value': (v instanceof Date ? v : new Date(v as string)).toISOString()
              };
              continue;
            }
            if (k === 'model') {
              payload['iscarb:model'] = v;
              continue;
            }
            if (k === 'latencyMs') {
              payload['iscarb:latency'] = v;
              continue;
            }
          }
          
          const formatted = this.formatValue(v, k, parentDomain);
          if (formatted !== undefined) payload[k] = formatted;
        }
        return payload;
      }
      return value;
    }
    return value;
  }

  async serialize(domain: string, modelName: string, id: string, expand: boolean = false): Promise<any> {
    let query: any = { where: { id } };

    if (expand && modelName.toLowerCase() === 'student') {
      query.include = {
        universityRef: true,
        grades: true,
        aiTutoringSessions: true,
        enrollments: { include: { course: true } },
        careerProfile: true,
        employabilityProfile: true,
        studentBadges: true,
        studyPlans: true,
        learningProfile: true,
        successGoals: true,
        aistudyRecommendations: true,
        // Only current answers — retakes leave isCurrent=false leftovers that
        // must not appear as live graph edges.
        assessmentResponses: { where: { isCurrent: true } },
      };
    }

    // @ts-ignore
    const entity = await db[modelName].findUnique(query);
    if (!entity) return null;

    const payload: any = {
      "@context": {
        ...this.baseContext,
        "@vocab": `https://iscarb.edu/ontology/${domain}/`
      },
      "@id": `https://iscarb.edu/ontology/${domain}/${modelName.toLowerCase()}/${id}`,
      "@type": modelName,
    };

    for (const [key, value] of Object.entries(entity)) {
      if (key === 'id') continue;
      if (value === null || value === undefined) continue;
      // Empty relation arrays clutter the graph without adding meaning
      if (Array.isArray(value) && value.length === 0) continue;
      const formatted = this.formatValue(value, key, domain);
      if (formatted !== undefined) payload[key] = formatted;
    }

    // BRD Appendix F: student --iscarb:hasResponse--> each graded answer
    if (Array.isArray(payload.assessmentResponses) && payload.assessmentResponses.length > 0) {
      payload['iscarb:hasResponse'] = payload.assessmentResponses;
    }
    delete payload.assessmentResponses; // Clean up vocabulary, regardless of whether it's empty or not

    
    // P0.3: Map EmployabilityProfile facts to the root student node
    if (payload.employabilityProfile) {
      const ep = payload.employabilityProfile;
      if (ep.specialization) payload['iscarb:specialization'] = ep.specialization;
      if (ep.computedAt) {
        try {
          payload['iscarb:computedAt'] = {
            '@type': 'xsd:dateTime',
            '@value': (ep.computedAt instanceof Date ? ep.computedAt : new Date(ep.computedAt)).toISOString()
          };
        } catch (e) {
          // Ignore invalid date
        }
      }
      if (ep.composite !== undefined) payload['iscarb:composite'] = ep.composite;
      if (ep.passed !== undefined) payload['iscarb:passed'] = ep.passed;
      if (ep.band) payload['iscarb:band'] = {
        '@id': `https://iscarb.edu/ontology/assessment/band/${encodeURIComponent(ep.band.replace(/\s+/g, ''))}`,
        '@type': 'iscarb:Band',
        'rdfs:label': ep.band
      };
      if (ep.dimensionsJson) {
        try {
          const dims = JSON.parse(ep.dimensionsJson);
          if (typeof dims === 'object' && dims !== null && !Array.isArray(dims)) {
            payload['iscarb:dimensionScore'] = Object.entries(dims).map(([dim, score]) => ({
              '@type': 'iscarb:DimensionScore',
              'iscarb:dimension': `https://iscarb.edu/ontology/assessment/dimension/${encodeURIComponent(dim)}`,
              'iscarb:value': score
            }));
          } else if (Array.isArray(dims)) {
            payload['iscarb:dimensionScore'] = dims.map((d: any) => ({
              '@type': 'iscarb:DimensionScore',
              'iscarb:dimension': `https://iscarb.edu/ontology/assessment/dimension/${encodeURIComponent(d.dimension || d.name)}`,
              'iscarb:value': d.score || d.value
            }));
          }
        } catch (e) {
          // Ignore invalid JSON
        }
      }
    }
    
    if (payload.readinessScore !== undefined) {
      payload['iscarb:readinessScore'] = payload.readinessScore;
    }

    return payload;
  }
}

export const jsonLdEngine = new JsonLdEngine();
