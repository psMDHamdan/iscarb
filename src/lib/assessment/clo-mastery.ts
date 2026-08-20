// src/lib/assessment/clo-mastery.ts

interface CLOMastery {
  cloId: string;
  cloText: string;
  bloomLevel: string;
  courseId: string;
  assessments: {
    assessmentId: string;
    score: number;
    maxScore: number;
    date: Date;
  }[];
  masteryScore: number; // 0-100 weighted average
  status: 'not_started' | 'in_progress' | 'mastered' | 'remediation_needed';
  lastAssessed: Date;
}

// Mastery calculation
export function calculateCLOMastery(
  assessments: CLOMastery['assessments']
): { masteryScore: number; status: CLOMastery['status'] } {
  if (assessments.length === 0) {
    return { masteryScore: 0, status: 'not_started' };
  }

  // Weighted by recency: more recent assessments count more
  const now = Date.now();
  let weightedSum = 0;
  let weightSum = 0;

  for (const a of assessments) {
    const daysAgo = (now - a.date.getTime()) / (1000 * 60 * 60 * 24);
    const weight = Math.exp(-daysAgo / 30); // half-life of 30 days
    weightedSum += (a.score / a.maxScore) * 100 * weight;
    weightSum += weight;
  }

  const masteryScore = Math.round(weightedSum / weightSum);

  let status: CLOMastery['status'];
  if (masteryScore >= 80) status = 'mastered';
  else if (masteryScore >= 60) status = 'in_progress';
  else status = 'remediation_needed';

  return { masteryScore, status };
}
