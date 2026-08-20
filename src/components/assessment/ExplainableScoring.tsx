// Explainable Scoring Details Component
// Displays AI reasoning for each criterion score
// src/components/assessment/ExplainableScoring.tsx

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Brain, Quote } from 'lucide-react';

interface CriterionEvaluation {
  criterion: string;
  scoreGiven: number;
  maxScore: number;
  weight: number;
  reasoning: string;
  evidenceQuoted: string;
}

interface ExplainableScoringProps {
  evaluations: CriterionEvaluation[];
  overallScore: number;
  studentResponse: string;
}

export function ExplainableScoring({
  evaluations,
  overallScore,
  studentResponse,
}: ExplainableScoringProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(
    new Set()
  );

  const toggleCriterion = (criterion: string) => {
    const newExpanded = new Set(expandedCriteria);
    if (newExpanded.has(criterion)) {
      newExpanded.delete(criterion);
    } else {
      newExpanded.add(criterion);
    }
    setExpandedCriteria(newExpanded);
  };

  const expandAll = () => {
    setExpandedCriteria(new Set(evaluations.map((e) => e.criterion)));
  };

  const collapseAll = () => {
    setExpandedCriteria(new Set());
  };

  // Calculate score for each criterion as percentage
  const getCriterionPercentage = (scoreGiven: number, maxScore: number) => {
    return Math.round((scoreGiven / maxScore) * 100);
  };

  // Determine score quality for coloring
  const getScoreQuality = (percentage: number) => {
    if (percentage >= 85) return { label: 'Excellent', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    if (percentage >= 70) return { label: 'Good', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    if (percentage >= 55) return { label: 'Satisfactory', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    if (percentage >= 40) return { label: 'Needs Work', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
    return { label: 'Poor', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              How Your Response Was Scored
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="text-xs"
              >
                <ChevronDown className="w-3 h-3 mr-1" />
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="text-xs"
              >
                <ChevronUp className="w-3 h-3 mr-1" />
                Collapse All
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Each criterion below shows what the AI evaluated and the reasoning behind your score.
            Click to expand details and see evidence from your response.
          </p>
        </CardHeader>
      </Card>

      {/* Criteria Evaluations */}
      <div className="space-y-3">
        {evaluations.map((evaluation, idx) => {
          const percentage = getCriterionPercentage(
            evaluation.scoreGiven,
            evaluation.maxScore
          );
          const quality = getScoreQuality(percentage);
          const isExpanded = expandedCriteria.has(evaluation.criterion);

          return (
            <Card key={idx} className="overflow-hidden">
              <div
                onClick={() => toggleCriterion(evaluation.criterion)}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground text-lg">
                          {evaluation.criterion}
                        </h3>
                        <Badge className={quality.color}>
                          {quality.label}
                        </Badge>
                      </div>

                      {/* Score Display */}
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {evaluation.scoreGiven}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            out of {evaluation.maxScore}
                          </p>
                        </div>

                        {/* Score Bar */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-primary to-accent h-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-xs font-semibold text-foreground">
                              {percentage}%
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Weight: {Math.round(evaluation.weight * 100)}% of total
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div className="ml-4 text-muted-foreground">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <CardContent className="pt-0 space-y-4 border-t">
                  {/* Reasoning Section */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">
                      AI Reasoning
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground leading-relaxed">
                      {evaluation.reasoning}
                    </div>
                  </div>

                  {/* Evidence Section */}
                  {evaluation.evidenceQuoted && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <Quote className="w-4 h-4" />
                        Evidence from Your Response
                      </h4>
                      <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 p-3 rounded text-sm text-foreground">
                        <p className="italic">
                          &quot;{evaluation.evidenceQuoted}&quot;
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Score Justification */}
                  <div className="bg-primary/5 rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground">
                      You earned{' '}
                      <span className="font-semibold text-primary">
                        {evaluation.scoreGiven} of {evaluation.maxScore} points
                      </span>
                      {' '}on this criterion. This represents{' '}
                      <span className="font-semibold">
                        {percentage}%
                      </span>
                      {' '}proficiency on{' '}
                      <span className="font-semibold">
                        {evaluation.criterion.toLowerCase()}
                      </span>
                      .
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Score Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Overall Score Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground">
            Your overall score of <span className="font-bold text-lg text-primary">{overallScore}</span> was calculated by:
          </p>
          <ol className="text-sm text-foreground space-y-2 list-decimal list-inside">
            <li>Evaluating each criterion using the rubric</li>
            <li>Grounding evaluation in your specific response</li>
            <li>Applying criterion weights (importance)</li>
            <li>Combining weighted scores for final result</li>
          </ol>
          <div className="bg-background rounded-lg p-3 mt-3">
            <p className="text-xs text-muted-foreground">
              This scoring is provided by AI evaluation and has been validated
              for fairness and consistency. If you believe the score is
              inaccurate, you can request a human review.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips for Improvement */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="text-base text-orange-700 dark:text-orange-300">
            Tips for Next Time
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>
              Focus on criteria where you scored lower (there&apos;s the most
              room for improvement)
            </li>
            <li>
              Use specific examples and evidence to support your points
            </li>
            <li>
              Review the rubric before responding to understand expectations
            </li>
            <li>
              Practice similar scenarios to build confidence in high-weight
              criteria
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
