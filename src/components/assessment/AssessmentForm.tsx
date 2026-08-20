// Assessment Response Form Component
// src/components/assessment/AssessmentForm.tsx

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AssessmentFormProps {
  questionId: string;
  submissionId: string;
  onSubmit: (response: string) => Promise<void>;
  isSubmitting?: boolean;
  defaultValue?: string;
  maxCharacters?: number;
  minCharacters?: number;
}

export function AssessmentForm({
  questionId,
  submissionId,
  onSubmit,
  isSubmitting = false,
  defaultValue = '',
  maxCharacters = 5000,
  minCharacters = 50,
}: AssessmentFormProps) {
  const [response, setResponse] = useState(defaultValue);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const characterCount = response.length;
  const isValid = characterCount >= minCharacters && characterCount <= maxCharacters;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!response.trim()) {
      setError('Please enter a response');
      return;
    }

    if (characterCount < minCharacters) {
      setError(
        `Response too short. Minimum ${minCharacters} characters (${characterCount}/${minCharacters})`
      );
      return;
    }

    if (characterCount > maxCharacters) {
      setError(
        `Response too long. Maximum ${maxCharacters} characters (${characterCount}/${maxCharacters})`
      );
      return;
    }

    try {
      await onSubmit(response);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit response'
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Response</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your response below. Be thorough and address all aspects of the scenario.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">
                  Error
                </p>
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Success display */}
          {success && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Success
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your response has been submitted and is being scored...
                </p>
              </div>
            </div>
          )}

          {/* Textarea */}
          <div className="space-y-2">
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Enter your detailed response here..."
              className="min-h-48 resize-none"
              disabled={isSubmitting || success}
            />

            {/* Character counter */}
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()} characters
              </p>
              <div className="flex items-center gap-2">
                {characterCount < minCharacters && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Minimum {minCharacters} characters required
                  </p>
                )}
                {characterCount > maxCharacters && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Maximum exceeded
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            size="lg"
            disabled={!isValid || isSubmitting || success}
            className="w-full"
          >
            {isSubmitting && <span className="animate-spin mr-2">⟳</span>}
            {isSubmitting
              ? 'Submitting and Scoring...'
              : success
                ? 'Submitted ✓'
                : 'Submit Response'}
          </Button>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground text-center">
            Your response will be automatically scored using AI evaluation.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
