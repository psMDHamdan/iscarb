// src/lib/assessment/ai-question-generation.service.ts
// AI-Powered Question Generation for ALL Assessment Types
// Uses iSCARB's chatJson AI Gateway (DeepSeek via NVIDIA)

import "server-only";
import { chatJson } from "@/lib/ai-engine";
import { db } from "@/lib/db";
import { getQAEnginePrompt } from "./prompts/qa-engine.prompt";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type QuestionType = 'MCQ' | 'essay' | 'short_answer' | 'coding' | 'case_study' | 'file_upload';
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AssessmentTypeKey = 'quiz' | 'exam' | 'assignment' | 'coding' | 'viva' | 'practice';

export interface CourseLearningOutcome {
  id: string;
  number: string;
  text: string;
  bloomLevel: BloomLevel;
  weight: number;
}

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  bloomLevel: BloomLevel;
  difficulty: Difficulty;
  prompt: string;
  promptAr?: string;
  options?: MCQOption[];
  correctAnswer?: string;
  explanation: string;
  explanationAr?: string;
  sourceReference: string;
  points: number;
  cloAlignment: string;
  codeTemplate?: string; // for coding questions
  testCases?: TestCase[]; // for coding questions
  rubricCriteria?: QuestionRubricCriterion[]; // for essay/assignment
  validation?: {
    status: 'PASS' | 'REQUIRES_CORRECTION' | 'REJECT';
    issuesFound?: string[];
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    correctiveAction?: string;
    reasoning?: string;
  };
}

export interface MCQOption {
  id: string;
  text: string;
  textAr?: string;
  isCorrect: boolean;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface QuestionRubricCriterion {
  name: string;
  weight: number;
  descriptor: string;
  maxScore: number;
}

export interface QuestionGenerationRequest {
  courseId: string;
  courseName: string;
  courseCode: string;
  specialization: string;
  clos: CourseLearningOutcome[];
  assessmentType: AssessmentTypeKey;
  questionCount: number;
  difficulty: Difficulty;
  questionTypes: QuestionType[];
  language: 'en' | 'ar';
  contentChunks: ContentChunk[];
  facultyId: string;
  domain?: string;
  jobRole?: string;
  seniorityLevel?: string;
}

export interface ContentChunk {
  id: string;
  text: string;
  sourceFile: string;
  pageNumber?: number;
  cloTags: string[];
}

export interface QuestionGenerationResult {
  questions: GeneratedQuestion[];
  rubric: QuestionRubricCriterion[];
  coverage: CLOCoverage[];
  generationMetadata: {
    model: string;
    tokensUsed: number;
    latencyMs: number;
    generatedAt: Date;
  };
}

export interface CLOCoverage {
  cloId: string;
  cloText: string;
  questionsGenerated: number;
  bloomLevelsCovered: BloomLevel[];
  coveragePercentage: number;
}

// ─────────────────────────────────────────────────────────────
// MAIN SERVICE
// ─────────────────────────────────────────────────────────────

export class AIQuestionGenerationService {

  /**
   * Generate a complete assessment with questions, rubric, and CLO coverage
   */
  async generateAssessment(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    const startTime = Date.now();

    // Step 1: Select content chunks relevant to target CLOs
    const relevantChunks = this.selectRelevantChunks(request.contentChunks, request.clos);

    // Step 2: Distribute questions across CLOs based on weights
    const questionDistribution = this.distributeQuestions(request.clos, request.questionCount);

    // Step 3: Generate questions for each CLO
    const allQuestions: GeneratedQuestion[] = [];

    for (const [cloId, count] of Object.entries(questionDistribution)) {
      const clo = request.clos.find((c) => c.id === cloId);
      if (!clo) continue;

      const chunksForCLO = relevantChunks.filter((c) => c.cloTags.includes(cloId));
      const combinedContext = chunksForCLO.map((c) => c.text).join('\n\n---\n\n');

      const questions = await this.generateQuestionsForCLO({
        clo,
        courseContext: combinedContext,
        count,
        difficulty: request.difficulty,
        questionTypes: request.questionTypes,
        language: request.language,
        assessmentType: request.assessmentType,
        courseName: request.courseName,
        courseCode: request.courseCode,
        domain: request.domain,
        jobRole: request.jobRole,
        seniorityLevel: request.seniorityLevel,
      });

      allQuestions.push(...questions);
    }

    // Step 4: Generate rubric for open-ended questions
    const rubric = this.assessmentTypeNeedsRubric(request.assessmentType)
      ? await this.generateRubric(request.clos, request.assessmentType, request.language)
      : [];

    // Step 5: Calculate CLO coverage
    const coverage = this.calculateCoverage(request.clos, allQuestions);

    const latencyMs = Date.now() - startTime;

    return {
      questions: allQuestions,
      rubric,
      coverage,
      generationMetadata: {
        model: process.env.EXAM_LIVE_GENERATION_MODEL || process.env.OPENAI_CHAT_MODEL || 'nvidia/nemotron-3-nano-30b-a3b',
        tokensUsed: 0,
        latencyMs,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Persist generated questions to the database for faculty review
   */
  async persistQuestions(
    questions: GeneratedQuestion[],
    courseId: string,
    facultyId: string,
    assessmentType: AssessmentTypeKey,
  ): Promise<void> {
    for (const q of questions) {
      await db.generatedQuestion.create({
        data: {
          courseId,
          cloId: q.cloAlignment,
          type: q.type,
          bloomLevel: q.bloomLevel,
          difficulty: q.difficulty,
          prompt: q.prompt,
          promptAr: q.promptAr ?? null,
          options: q.options ? JSON.parse(JSON.stringify(q.options)) : undefined,
          correctAnswer: q.correctAnswer ?? null,
          explanation: q.explanation,
          sourceReference: q.sourceReference,
          points: q.points,
          status: 'pending_review', // Faculty must approve
          generatedBy: facultyId,
        },
      });
    }
  }

  /**
   * Generate questions for a single CLO
   */
  private async generateQuestionsForCLO(params: {
    clo: CourseLearningOutcome;
    courseContext: string;
    count: number;
    difficulty: Difficulty;
    questionTypes: QuestionType[];
    language: 'en' | 'ar';
    assessmentType: AssessmentTypeKey;
    courseName: string;
    courseCode: string;
    domain?: string;
    jobRole?: string;
    seniorityLevel?: string;
  }): Promise<GeneratedQuestion[]> {
    const systemPrompt = getQAEnginePrompt(params.language);

    const userPrompt = `COURSE: ${params.courseName} (${params.courseCode})
CLO/COMPETENCY: ${params.clo.text}
Bloom's Level: ${params.clo.bloomLevel}
Difficulty: ${params.difficulty}
Assessment Type: ${params.assessmentType}
${params.domain ? `Domain: ${params.domain}\n` : ''}${params.jobRole ? `Job Role: ${params.jobRole}\n` : ''}${params.seniorityLevel ? `Seniority Level: ${params.seniorityLevel}\n` : ''}
SOURCE MATERIAL:
"""
${params.courseContext.substring(0, 6000)}
"""

Generate ${params.count} ${params.questionTypes.join('/')} question(s).

OUTPUT SCHEMA:
{
  "questions": [
    // Array of JSON objects EXACTLY matching the format specified in Section 25 of the system instructions.
  ]
}`;

    try {
      const result = await chatJson({
        system: systemPrompt,
        user: userPrompt,
        temperature: 0.3,
        model: process.env.EXAM_LIVE_GENERATION_MODEL || process.env.OPENAI_CHAT_MODEL || 'nvidia/nemotron-3-nano-30b-a3b',
      });

      const parsed = result.json ?? JSON.parse(result.content);
      if (!parsed?.questions || !Array.isArray(parsed.questions)) {
        return this.generateFallbackQuestions(params);
      }
      return parsed.questions
        .filter((q: any) => !q.validation || q.validation.status === 'PASS' || q.status === 'PASS')
        .map((q: any, idx: number) => {
          const options = q.options?.map((opt: any) => ({
            id: opt.id || opt.id,
            text: opt.text || opt.text,
            isCorrect: (opt.id || opt.id) === q.correct_answer
          })) || [];

          return {
            ...q,
            id: `${params.clo.id}-q${idx + 1}`,
            prompt: (q.scenario && q.task) ? `Scenario: ${q.scenario}\n\nTask: ${q.task}` : (q.prompt || ''),
            options,
            correctAnswer: q.correct_answer || q.correctAnswer,
            validation: q.validation ? {
              status: q.status || 'PASS',
              reasoning: typeof q.validation === 'object' ? JSON.stringify(q.validation) : q.validation
            } : undefined
          };
        });
    } catch (error) {
      console.error('Question generation failed for CLO:', params.clo.id, error);
      return this.generateFallbackQuestions(params);
    }
  }

  /**
   * Generate rubric for open-ended assessments
   */
  private async generateRubric(
    clos: CourseLearningOutcome[],
    assessmentType: AssessmentTypeKey,
    language: 'en' | 'ar'
  ): Promise<QuestionRubricCriterion[]> {
    const systemPrompt = `You are an assessment rubric designer.
Create a weighted rubric where criteria sum to 100.
Each criterion must map to a course learning outcome.`;

    const userPrompt = `Assessment Type: ${assessmentType}
CLOs: ${clos.map((c) => `${c.number}: ${c.text}`).join('\n')}
Language: ${language}

Generate 3-5 rubric criteria with weights summing to 100.

OUTPUT SCHEMA:
{
  "criteria": [
    {"name": "Criterion Name", "weight": 40, "descriptor": "What this assesses", "maxScore": 40}
  ]
}`;

    try {
      const result = await chatJson({
        system: systemPrompt,
        user: userPrompt,
        temperature: 0.2,
      });

      const parsed = result.json ?? JSON.parse(result.content);
      if (parsed?.criteria && Array.isArray(parsed.criteria)) {
        return parsed.criteria;
      }
      return this.fallbackRubric();
    } catch {
      return this.fallbackRubric();
    }
  }

  private fallbackRubric(): QuestionRubricCriterion[] {
    return [
      { name: 'Conceptual Understanding', weight: 40, descriptor: 'Demonstrates understanding of core concepts', maxScore: 40 },
      { name: 'Application', weight: 35, descriptor: 'Applies knowledge to solve problems', maxScore: 35 },
      { name: 'Communication', weight: 25, descriptor: 'Presents ideas clearly and logically', maxScore: 25 },
    ];
  }

  // ─────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────

  private selectRelevantChunks(chunks: ContentChunk[], clos: CourseLearningOutcome[]): ContentChunk[] {
    const cloIds = new Set(clos.map((c) => c.id));
    return chunks.filter((c) => c.cloTags.some((tag) => cloIds.has(tag)));
  }

  private distributeQuestions(clos: CourseLearningOutcome[], totalCount: number): Record<string, number> {
    const totalWeight = clos.reduce((sum, c) => sum + c.weight, 0);
    const distribution: Record<string, number> = {};

    for (const clo of clos) {
      distribution[clo.id] = Math.max(1, Math.round((clo.weight / totalWeight) * totalCount));
    }

    // Adjust to match total count
    const currentTotal = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (currentTotal !== totalCount) {
      const diff = totalCount - currentTotal;
      const largestCLO = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0][0];
      distribution[largestCLO] += diff;
    }

    return distribution;
  }

  private calculateCoverage(clos: CourseLearningOutcome[], questions: GeneratedQuestion[]): CLOCoverage[] {
    return clos.map((clo) => {
      const cloQuestions = questions.filter((q) => q.cloAlignment === clo.id);
      const bloomLevels = [...new Set(cloQuestions.map((q) => q.bloomLevel))];

      return {
        cloId: clo.id,
        cloText: clo.text,
        questionsGenerated: cloQuestions.length,
        bloomLevelsCovered: bloomLevels as BloomLevel[],
        coveragePercentage: Math.min(100, (cloQuestions.length / Math.max(1, clos.length)) * 100),
      };
    });
  }

  private assessmentTypeNeedsRubric(type: AssessmentTypeKey): boolean {
    return ['exam', 'assignment', 'viva'].includes(type);
  }

  private generateFallbackQuestions(params: {
    clo: CourseLearningOutcome;
    questionTypes: QuestionType[];
    difficulty: Difficulty;
    courseName: string;
    language?: 'en' | 'ar';
  }): GeneratedQuestion[] {
    const isAr = params.language === 'ar';
    return [{
      id: `${params.clo.id}-fallback-1`,
      type: params.questionTypes[0] || 'short_answer',
      bloomLevel: params.clo.bloomLevel,
      difficulty: params.difficulty,
      prompt: isAr
        ? `اشرح ${params.clo.text} باستخدام أمثلة تطبيقية من مقرر ${params.courseName}.`
        : `Explain ${params.clo.text} using examples from ${params.courseName}.`,
      explanation: isAr
        ? 'يقيم هذا السؤال مدى استيعاب مفهوم مخرج التعلّم المحوري للمقرر.'
        : 'This question assesses understanding of the CLO.',
      sourceReference: isAr ? 'خطة المقرر الدراسية' : 'Course syllabus',
      points: 5,
      cloAlignment: params.clo.id,
    }];
  }
}

/** Strips foreign CJK characters, control codes, and replacement characters */
export function sanitizeArabicText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uFFFD\u007F-\u009F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Singleton export
export const aiQuestionGeneration = new AIQuestionGenerationService();
