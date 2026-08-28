// src/lib/assessment/course-scoring.service.ts
// AI Scoring for Course-Based Assessments (Essays, Assignments, Coding, Viva)
// Uses the same four-block prompt architecture as employability scoring

import "server-only";
import { chatJson, withTimeout } from "@/lib/ai-engine";
import { db } from "@/lib/db";
import { bandFor } from "./framework";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface CourseRubricCriterion {
  id: string;
  name: string;
  weight: number;
  descriptor: string;
  maxScore: number;
  cloAlignment?: string;
}

export interface CourseAssessmentConfig {
  assessmentId: string;
  courseId: string;
  courseName: string;
  assessmentType: 'quiz' | 'exam' | 'assignment' | 'coding' | 'viva';
  rubric: CourseRubricCriterion[];
  clos: { id: string; text: string; bloomLevel: string }[];
  passThreshold: number;
}

export interface CourseScoredResponse {
  score: number;
  band: string;
  passed: boolean;
  perCriterion: CourseCriterionScore[];
  feedback: string;
  strengths: string[];
  improvements: string[];
  cloMastery: CLOMasteryResult[];
  source: 'ai' | 'fallback' | 'faculty';
  model?: string;
  latencyMs: number;
}

export interface CourseCriterionScore {
  criterionId: string;
  criterionName: string;
  weight: number;
  score: number;
  maxScore: number;
  feedback: string;
  cloAlignment?: string;
}

export interface CLOMasteryResult {
  cloId: string;
  cloText: string;
  masteryScore: number; // 0-100
  status: 'not_started' | 'in_progress' | 'mastered' | 'remediation_needed';
  contributingCriteria: string[];
}

// ─────────────────────────────────────────────────────────────
// MAIN SERVICE
// ─────────────────────────────────────────────────────────────

export class CourseScoringService {

  /**
   * Score a course-based assessment response using AI
   */
  async scoreResponse(
    config: CourseAssessmentConfig,
    studentResponse: string,
    questionContext: string,
    studentId: string
  ): Promise<CourseScoredResponse> {
    const startTime = Date.now();

    // Build the four-block prompt for course scoring
    const systemPrompt = this.buildCourseSystemPrompt(config);
    const userPrompt = this.buildCourseUserPrompt(config, questionContext, studentResponse);

    let scored: CourseScoredResponse;
    let source: 'ai' | 'fallback' = 'ai';
    let model = 'nvidia/nemotron-3-nano-30b-a3b';

    try {
      // Call AI engine with timeout
      const aiResult = await withTimeout(
        chatJson({
          system: systemPrompt,
          user: userPrompt,
          temperature: 0.2,
        }),
        20000,
        "course-scoring"
      );

      scored = this.parseAIScoringResponse(aiResult, config);

    } catch (error) {
      console.error('Course AI scoring failed, using fallback:', error);
      scored = this.deterministicFallbackScore(config, studentResponse);
      source = 'fallback';
    }

    scored.source = source;
    scored.model = model;
    scored.latencyMs = Date.now() - startTime;

    // Calculate CLO mastery from criterion scores
    scored.cloMastery = this.calculateCLOMastery(config, scored.perCriterion);

    return scored;
  }

  /**
   * Build system prompt for course scoring (Block 1)
   */
  private buildCourseSystemPrompt(config: CourseAssessmentConfig): string {
    return `You are iSCARB AI, an expert academic assessor for ${config.courseName}.
You evaluate student responses against course learning outcomes and rubric criteria.

Scoring Rules:
- Return ONLY valid JSON. No markdown.
- Overall score: 0-100. Per-criterion: 0 to maxScore.
- Be fair but rigorous. A "pass" requires demonstrating competency, not just mentioning keywords.
- For coding: evaluate correctness, efficiency, readability, and edge case handling.
- For essays: evaluate depth of analysis, use of evidence, logical structure, and clarity.
- Provide actionable, specific feedback. Generic praise is not helpful.
- Language: Evaluate in the same language as the student response.`;
  }

  /**
   * Build user prompt for course scoring (Blocks 2-4)
   */
  private buildCourseUserPrompt(
    config: CourseAssessmentConfig,
    questionContext: string,
    studentResponse: string
  ): string {
    const rubricBlock = config.rubric
      .map((c) => `${c.name} (weight: ${c.weight}%, max: ${c.maxScore}): ${c.descriptor}${c.cloAlignment ? ` [CLO: ${c.cloAlignment}]` : ''}`)
      .join('\n');

    const closBlock = config.clos
      .map((c) => `CLO ${c.id}: ${c.text} (Bloom's: ${c.bloomLevel})`)
      .join('\n');

    return `COURSE: ${config.courseName}
ASSESSMENT TYPE: ${config.assessmentType}
PASS THRESHOLD: ${config.passThreshold}%

COURSE LEARNING OUTCOMES:
${closBlock}

QUESTION / TASK:
"""
${questionContext}
"""

RUBRIC:
${rubricBlock}

STUDENT RESPONSE:
"""
${studentResponse}
"""

OUTPUT SCHEMA:
{
  "score": 0,
  "perCriterion": [
    {
      "criterionId": "c1",
      "criterionName": "Name",
      "weight": 40,
      "score": 0,
      "maxScore": 40,
      "feedback": "Specific feedback for this criterion"
    }
  ],
  "feedback": "2-3 sentence overall feedback",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "improvements": ["Specific improvement 1", "Specific improvement 2"]
}`;
  }

  /**
   * Parse AI scoring response
   */
  private parseAIScoringResponse(aiResult: { content: string; json?: Record<string, unknown> }, config: CourseAssessmentConfig): CourseScoredResponse {
    const parsed = aiResult.json ?? JSON.parse(aiResult.content);

    // Clamp scores
    let totalScore = Math.max(0, Math.min(100, parsed.score || 0));

    const perCriterion: CourseCriterionScore[] = (parsed.perCriterion || []).map((pc: any) => {
      const criterion = config.rubric.find((c) => c.id === pc.criterionId || c.name === pc.criterionName);
      const maxScore = criterion?.maxScore || pc.maxScore || 100;
      return {
        criterionId: pc.criterionId || 'unknown',
        criterionName: pc.criterionName || 'Unknown',
        weight: pc.weight || criterion?.weight || 0,
        score: Math.max(0, Math.min(maxScore, pc.score || 0)),
        maxScore,
        feedback: pc.feedback || '',
        cloAlignment: criterion?.cloAlignment,
      };
    });

    // Recalculate total from criteria if needed
    if (perCriterion.length > 0) {
      const totalWeight = perCriterion.reduce((sum, c) => sum + c.weight, 0);
      const weightedScore = perCriterion.reduce((sum, c) => sum + (c.score / c.maxScore) * c.weight, 0);
      totalScore = Math.round((weightedScore / totalWeight) * 100);
    }

    return {
      score: totalScore,
      band: bandFor(totalScore),
      passed: totalScore >= config.passThreshold,
      perCriterion,
      feedback: parsed.feedback || 'No feedback provided.',
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      cloMastery: [], // populated after
      source: 'ai',
      latencyMs: 0,
    };
  }

  /**
   * Deterministic fallback when AI is unavailable
   */
  private deterministicFallbackScore(
    config: CourseAssessmentConfig,
    response: string
  ): CourseScoredResponse {
    const text = response.toLowerCase();
    const wordCount = text.split(/\s+/).length;

    // Simple heuristics
    const perCriterion = config.rubric.map((criterion) => {
      // Check if response mentions key concepts from descriptor
      const descriptorWords = criterion.descriptor.toLowerCase().split(/\s+/);
      const matches = descriptorWords.filter((w) => text.includes(w) && w.length > 4);
      const matchRatio = descriptorWords.length > 0 ? matches.length / descriptorWords.length : 0.5;

      // Word count bonus for essays
      const wordBonus = Math.min(0.2, wordCount / 1000);

      const score = Math.round(criterion.maxScore * Math.min(1, matchRatio + wordBonus));

      return {
        criterionId: criterion.id,
        criterionName: criterion.name,
        weight: criterion.weight,
        score: Math.min(criterion.maxScore, score),
        maxScore: criterion.maxScore,
        feedback: `Scored via deterministic fallback. Response length: ${wordCount} words.`,
        cloAlignment: criterion.cloAlignment,
      };
    });

    const totalWeight = perCriterion.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore = perCriterion.reduce((sum, c) => sum + (c.score / c.maxScore) * c.weight, 0);
    const totalScore = Math.round((weightedScore / totalWeight) * 100);

    return {
      score: totalScore,
      band: classifyBand(totalScore),
      passed: totalScore >= config.passThreshold,
      perCriterion,
      feedback: 'Scored via deterministic fallback due to AI unavailability. Please review manually.',
      strengths: ['Response submitted successfully'],
      improvements: ['Consider expanding your answer with more specific details and examples.'],
      cloMastery: [],
      source: 'fallback',
      latencyMs: 0,
    };
  }

  /**
   * Calculate CLO mastery from criterion scores
   */
  private calculateCLOMastery(
    config: CourseAssessmentConfig,
    perCriterion: CourseCriterionScore[]
  ): CLOMasteryResult[] {
    const cloMap = new Map<string, { scores: number[]; criteria: string[]; text: string }>();

    for (const criterion of perCriterion) {
      if (criterion.cloAlignment) {
        const clo = config.clos.find((c) => c.id === criterion.cloAlignment);
        if (!clo) continue;

        if (!cloMap.has(criterion.cloAlignment)) {
          cloMap.set(criterion.cloAlignment, { scores: [], criteria: [], text: clo.text });
        }

        const entry = cloMap.get(criterion.cloAlignment)!;
        entry.scores.push((criterion.score / criterion.maxScore) * 100);
        entry.criteria.push(criterion.criterionName);
      }
    }

    return Array.from(cloMap.entries()).map(([cloId, data]) => {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;

      let status: CLOMasteryResult['status'];
      if (avgScore >= 80) status = 'mastered';
      else if (avgScore >= 60) status = 'in_progress';
      else status = 'remediation_needed';

      return {
        cloId,
        cloText: data.text,
        masteryScore: Math.round(avgScore),
        status,
        contributingCriteria: data.criteria,
      };
    });
  }

  /**
   * Update student CLO mastery in database
   */
  async updateCLOMastery(
    studentId: string,
    courseId: string,
    cloMastery: CLOMasteryResult[]
  ): Promise<void> {
    for (const mastery of cloMastery) {
      await db.cLOMastery.upsert({
        where: {
          studentId_courseId_cloId: {
            studentId,
            courseId,
            cloId: mastery.cloId,
          },
        },
        update: {
          masteryScore: mastery.masteryScore,
          status: mastery.status,
          lastAssessed: new Date(),
        },
        create: {
          studentId,
          courseId,
          cloId: mastery.cloId,
          cloText: mastery.cloText,
          masteryScore: mastery.masteryScore,
          status: mastery.status,
          lastAssessed: new Date(),
        },
      });
    }
  }
}

// Singleton export
export const courseScoring = new CourseScoringService();
