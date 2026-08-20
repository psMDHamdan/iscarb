// Assessment Scenario Display Component
// src/components/assessment/ScenarioDisplay.tsx

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Award } from 'lucide-react';

interface RubricCriterion {
  criterion: string;
  weight: number;
  descriptor: string;
  example_good?: string;
  example_bad?: string;
}

interface ScenarioDisplayProps {
  title: string;
  scenario: string;
  instructions: string;
  rubricCriteria: RubricCriterion[];
  timeLimit?: number; // minutes
  estimatedTime?: number; // minutes
  level?: string; // e.g., "L1-A", "L2"
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  questionNumber?: number;
  totalQuestions?: number;
}

export function ScenarioDisplay({
  title,
  scenario,
  instructions,
  rubricCriteria,
  timeLimit,
  estimatedTime,
  level,
  difficulty = 'medium',
  questionNumber = 1,
  totalQuestions = 1,
}: ScenarioDisplayProps) {
  const difficultyColor = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-orange-100 text-orange-800',
    expert: 'bg-red-100 text-red-800',
  }[difficulty];

  return (
    <div className="space-y-6">
      {/* Header with metadata */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {level && (
            <p className="text-sm text-muted-foreground mt-1">
              Level: {level}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Badge className={difficultyColor}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
          {totalQuestions > 1 && (
            <Badge variant="outline">
              Question {questionNumber}/{totalQuestions}
            </Badge>
          )}
        </div>
      </div>

      {/* Scenario Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Scenario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
            {scenario}
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Respond</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{instructions}</p>
        </CardContent>
      </Card>

      {/* Rubric Criteria Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Scoring Criteria
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Your response will be evaluated on these criteria:
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {rubricCriteria.map((criterion, idx) => (
            <div key={idx} className="border-l-4 border-primary/30 pl-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-foreground">
                  {criterion.criterion}
                </h3>
                <Badge variant="secondary">
                  {Math.round(criterion.weight * 100)}%
                </Badge>
              </div>
              <p className="text-sm text-foreground mb-2">
                {criterion.descriptor}
              </p>

              {/* Example responses */}
              {(criterion.example_good || criterion.example_bad) && (
                <div className="mt-2 space-y-2 text-xs">
                  {criterion.example_good && (
                    <div className="bg-green-50 dark:bg-green-950 p-2 rounded border-l-2 border-green-500">
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        ✅ Good example:
                      </p>
                      <p className="text-green-800 dark:text-green-200">
                        {criterion.example_good}
                      </p>
                    </div>
                  )}
                  {criterion.example_bad && (
                    <div className="bg-red-50 dark:bg-red-950 p-2 rounded border-l-2 border-red-500">
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        ❌ Weak example:
                      </p>
                      <p className="text-red-800 dark:text-red-200">
                        {criterion.example_bad}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Time Information */}
      {(timeLimit || estimatedTime) && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6 flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              {timeLimit && (
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Time Limit: {timeLimit} minutes
                </p>
              )}
              {estimatedTime && (
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Estimated time: {estimatedTime} minutes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
