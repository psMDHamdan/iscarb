"use client";

import { useState } from "react";
import { PageHeader } from "@/components/iscarb/PageHeader";

interface Question {
  id: string;
  prompt: string;
  type: "short-answer" | "multiple-choice" | "essay" | "scenario";
  options?: string[];
  pointsPossible?: number;
}

interface AssessmentSubmissionFormProps {
  assessmentId: string;
  questions: Question[];
  submissionId: string;
  onSubmitComplete?: (result: { score: number; status: string }) => void;
}

export function AssessmentSubmissionForm({
  assessmentId,
  questions,
  submissionId,
  onSubmitComplete,
}: AssessmentSubmissionFormProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleResponseChange = (value: string) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/iscarb/assessment/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          assessmentId,
          responses: Object.entries(responses).map(([questionId, response]) => ({
            questionId,
            responseText: response,
            timestamp: new Date().toISOString(),
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Submission failed");
      }

      const result = await res.json();
      onSubmitComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Question ${currentIndex + 1} of ${questions.length}`}
        description="Answer each question to the best of your ability"
      />

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="bg-card border rounded-lg p-8 min-h-96 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-6">{currentQuestion?.prompt}</h2>

          <div className="space-y-4">
            {currentQuestion?.type === "multiple-choice" && currentQuestion.options ? (
              <fieldset className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={responses[currentQuestion.id] === option}
                      onChange={(e) => handleResponseChange(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-foreground">{option}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <textarea
                value={responses[currentQuestion?.id] || ""}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="Your answer here..."
                className="w-full min-h-64 px-4 py-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-4 justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-6 py-2 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {!isLast ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {submitting ? "Submitting..." : "Submit Assessment"}
            </button>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {Object.keys(responses).length} of {questions.length} answered
      </div>
    </div>
  );
}
