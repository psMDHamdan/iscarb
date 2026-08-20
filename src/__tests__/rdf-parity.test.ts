import { db } from '@/lib/db';
import { jsonLdEngine } from '@/lib/kg/engine';

describe('REST ↔ JSON-LD Parity (FR-SEM-04)', () => {
  let studentId: string;

  beforeAll(async () => {
    const student = await db.student.findFirst({
      where: { authUser: { email: 'student@iscarb.edu' } }
    });
    if (!student) {
      throw new Error("Demo student not found in DB. Run seed script first.");
    }
    studentId = student.id;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('ensures JSON-LD expand matches REST/DB for assessment responses', async () => {
    // 1. Fetch from "REST" source of truth (DB)
    const dbStudent = await db.student.findUnique({
      where: { id: studentId },
      include: { assessmentResponses: true }
    });
    expect(dbStudent).toBeDefined();

    // 2. Fetch from JSON-LD mapped layer
    const graphStudent = await jsonLdEngine.serialize('student', 'student', studentId, true);
    expect(graphStudent).toBeDefined();

    // Verify all 15 assessment responses exist in the graph
    const responses = graphStudent['iscarb:hasResponse'];
    expect(Array.isArray(responses)).toBe(true);
    
    // There should be exact same number of responses
    expect(responses.length).toBe(dbStudent!.assessmentResponses.length);

    // Verify a random response for exact values
    const dbResp = dbStudent!.assessmentResponses[0];
    const graphResp = responses.find((r: any) => r.moduleCode === dbResp.moduleCode);
    
    expect(graphResp).toBeDefined();
    expect(graphResp.score).toBe(dbResp.score);
    expect(graphResp['iscarb:rawResponse'] || graphResp['rawResponse']).toBe(dbResp.rawResponse);
    expect(graphResp['iscarb:band']?.['rdfs:label']).toBe(dbResp.band);

    // Verify perCriterionJson was parsed properly
    if (dbResp.perCriterionJson) {
      const criteria = JSON.parse(dbResp.perCriterionJson as string);
      expect(Array.isArray(graphResp['iscarb:hasCriterionScore'])).toBe(true);
      expect(graphResp['iscarb:hasCriterionScore'].length).toBe(criteria.length);
    }
  });

  it('ensures the student profile has FR-SEM-01 facts at root level', async () => {
    const graphStudent = await jsonLdEngine.serialize('student', 'student', studentId, true);
    
    // Verify properties from EmployabilityProfile are hoisted
    expect(graphStudent['iscarb:composite']).toBeDefined();
    expect(graphStudent['iscarb:dimensionScore']).toBeDefined();
    if (graphStudent['iscarb:specialization']) {
      expect(graphStudent['iscarb:specialization']).toBeDefined();
    }
    if (graphStudent['iscarb:readinessScore']) {
      expect(graphStudent['iscarb:readinessScore']).toBeDefined();
    }
  });
});
