/**
 * iSCARB Assessment Scoring — Pure Logic
 * ===========================================================================
 * Extracted from the submit route so it can be unit tested without mocking
 * Prisma or the request/response objects.
 *
 * All functions are pure — same input always produces the same output.
 * ===========================================================================
 */

export interface ScoreQuestion {
  id: string;
  type: string;
  pointsPossible: number;
  correctAnswer?: string | null;
}

export interface ScoreResponse {
  responseText?: string | null;
  selectedAnswer?: string | null;
}

export interface QuestionScore {
  questionId: string;
  pointsEarned: number;
  pointsPossible: number;
  autoScore: boolean;
}

export interface ScoringSummary {
  totalPointsPossible: number;
  totalEarned: number;
  percentageScore: number;
  autoScored: number;
  needsReview: number;
  finalStatus: 'SCORED' | 'SUBMITTED';
}

export interface FullScoringResult {
  scores: QuestionScore[];
  summary: ScoringSummary;
}

/**
 * Auto-score a single multiple-choice or true-false question.
 * Correct answer comparison supports both selectedAnswer and responseText.
 */
export function scoreMultipleChoice(
  question: ScoreQuestion,
  response?: ScoreResponse | null
): { pointsEarned: number } {
  if (!response || (!response.selectedAnswer && !response.responseText)) {
    return { pointsEarned: 0 };
  }

  const isCorrect =
    response.selectedAnswer === question.correctAnswer ||
    response.responseText?.trim().toLowerCase() ===
      String(question.correctAnswer).trim().toLowerCase();

  return {
    pointsEarned: isCorrect ? question.pointsPossible : 0,
  };
}

/**
 * Auto-score a short-answer or essay question.
 * Awards 50% partial credit for responses with 10+ characters,
 * 0 for responses shorter than 10 characters.
 */
export function scoreFreeText(
  question: ScoreQuestion,
  response?: ScoreResponse | null
): { pointsEarned: number } {
  if (!response || (!response.responseText && !response.selectedAnswer)) {
    return { pointsEarned: 0 };
  }

  const responseText = response.responseText || '';
  const contentLen = responseText.trim().length;
  const hasContent = contentLen > 0;

  if (hasContent && contentLen >= 10) {
    return { pointsEarned: Math.round(question.pointsPossible * 0.5) };
  }

  return { pointsEarned: 0 };
}

/**
 * Score a single question based on its type.
 * Returns points earned and whether the score was automatic or needs review.
 */
export function scoreQuestion(
  question: ScoreQuestion,
  response?: ScoreResponse | null
): QuestionScore {
  const mcOrTf = question.type === 'multiple-choice' || question.type === 'true-false';
  const freeText = question.type === 'short-answer' || question.type === 'essay';

  if (mcOrTf) {
    const { pointsEarned } = scoreMultipleChoice(question, response);
    return {
      questionId: question.id,
      pointsEarned,
      pointsPossible: question.pointsPossible,
      autoScore: true,
    };
  }

  if (freeText) {
    const { pointsEarned } = scoreFreeText(question, response);
    return {
      questionId: question.id,
      pointsEarned,
      pointsPossible: question.pointsPossible,
      autoScore: false, // flagged for faculty review
    };
  }

  // Unknown question type — 0 points, needs review
  return {
    questionId: question.id,
    pointsEarned: 0,
    pointsPossible: question.pointsPossible,
    autoScore: false,
  };
}

/**
 * Score all questions in an assessment against the student's responses.
 * Pure function — no side effects, no DB calls.
 *
 * @param questions — The assessment's questions (from DB)
 * @param responses — The student's responses, keyed by question ID
 * @returns Per-question scores and a summary with totals and status
 */
export function calculateScores(
  questions: ScoreQuestion[],
  responses: Record<string, ScoreResponse>
): FullScoringResult {
  const scores: QuestionScore[] = [];
  let totalEarned = 0;
  let autoScored = 0;
  let needsReview = 0;

  for (const question of questions) {
    const response = responses[question.id];
    const result = scoreQuestion(question, response);
    scores.push(result);
    totalEarned += result.pointsEarned;
    if (result.autoScore) {
      autoScored++;
    } else {
      needsReview++;
    }
  }

  const totalPointsPossible = questions.reduce(
    (sum, q) => sum + q.pointsPossible,
    0
  );

  const percentageScore =
    totalPointsPossible > 0
      ? Math.round((totalEarned / totalPointsPossible) * 100)
      : 0;

  const finalStatus: 'SCORED' | 'SUBMITTED' =
    needsReview > 0 ? 'SUBMITTED' : 'SCORED';

  return {
    scores,
    summary: {
      totalPointsPossible,
      totalEarned,
      percentageScore,
      autoScored,
      needsReview,
      finalStatus,
    },
  };
}

/**
 * Determine which responses from a request body are NOT yet in the DB
 * and need to be saved. Used by the submit route to handle the race
 * condition between autosave and manual submit.
 *
 * @param requestResponses — Responses from the POST body ({ questionId: { responseText, selectedAnswer } })
 * @param dbResponseIds — Set of question IDs that already have responses in the DB
 * @returns Array of { questionId, responseText, selectedAnswer } to persist
 */
export function findMissingResponses(
  requestResponses: Record<string, ScoreResponse> | undefined | null,
  dbResponseIds: Set<string>
): Array<{ questionId: string; responseText: string; selectedAnswer: string }> {
  if (!requestResponses || typeof requestResponses !== 'object') {
    return [];
  }

  const toSave: Array<{
    questionId: string;
    responseText: string;
    selectedAnswer: string;
  }> = [];

  for (const [questionId, response] of Object.entries(requestResponses)) {
    if (dbResponseIds.has(questionId)) continue;
    if (!response.responseText && !response.selectedAnswer) continue;

    toSave.push({
      questionId,
      responseText: response.responseText || '',
      selectedAnswer: response.selectedAnswer || '',
    });
  }

  return toSave;
}
