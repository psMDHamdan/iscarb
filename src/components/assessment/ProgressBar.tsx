// Progress Bar Component
// Shows current question progress (X of Y)
// src/components/assessment/ProgressBar.tsx

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  moduleName?: string;
}

export function ProgressBar({
  currentQuestion,
  totalQuestions,
  moduleName,
}: ProgressBarProps) {
  const progressPercent = (currentQuestion / totalQuestions) * 100;

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">
                Assessment Progress
              </h3>
              {moduleName && (
                <p className="text-xs text-muted-foreground mt-1">
                  {moduleName}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {currentQuestion}
              </p>
              <p className="text-xs text-muted-foreground">
                of {totalQuestions}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {Math.round(progressPercent)}% Complete
            </p>
          </div>

          {/* Question Counter */}
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-all ${
                  idx + 1 <= currentQuestion
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Status Message */}
          <p className="text-xs text-muted-foreground text-center">
            {currentQuestion === totalQuestions
              ? '✓ All questions completed. Review your responses or submit.'
              : `${totalQuestions - currentQuestion} question${
                  totalQuestions - currentQuestion > 1 ? 's' : ''
                } remaining`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
