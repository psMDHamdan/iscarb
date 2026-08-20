"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AssessmentCreationFormProps {
  classId?: string;
  onSuccess?: (assessmentId: string) => void;
}

export function AssessmentCreationForm({ classId, onSuccess }: AssessmentCreationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "quiz" as "quiz" | "exam" | "project" | "rubric" | "scenario",
    maxScore: 100,
    timeLimit: 60,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxScore" || name === "timeLimit" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // POST to the faculty assessments endpoint which creates proper Assessment records
      const res = await fetch("/api/v1/faculty/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          maxScore: formData.maxScore,
          settings: { timeLimit: formData.timeLimit },
          classId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create assessment");
      }

      const result = await res.json();
      const assessmentId = result.id || result.data?.id;
      onSuccess?.(assessmentId);
      router.push(`/faculty/assessments/${assessmentId}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Assessment Name</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Midterm Exam - Data Structures"
          required
          className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of what students will be assessed on"
          rows={4}
          className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
            <option value="project">Project</option>
            <option value="rubric">Rubric</option>
            <option value="scenario">Scenario</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Max Score</label>
          <input
            type="number"
            name="maxScore"
            value={formData.maxScore}
            onChange={handleChange}
            min="0"
            max="1000"
            className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
        <input
          type="number"
          name="timeLimit"
          value={formData.timeLimit}
          onChange={handleChange}
          min="5"
          max="480"
          className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border rounded-lg hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.title}
          className="flex-1 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Creating..." : "Create Assessment"}
        </button>
      </div>
    </form>
  );
}
