// Question Manager Component
// Admin interface for managing questions
// src/components/admin/QuestionManager.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Eye,
  Download,
  Plus,
} from 'lucide-react';

interface Question {
  id: string;
  title: string;
  scenario: string;
  difficulty: string;
  reviewStatus: string;
  createdAt: string;
  createdBy: string;
  publishedAt?: string;
}

export function QuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [filter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/questions');
      const data = await response.json();
      setQuestions(data.questions ?? []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sme_review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-orange-600';
      case 'expert':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'all') return true;
    return q.reviewStatus === filter;
  });

  const draftCount = questions.filter(
    (q) => q.reviewStatus === 'draft'
  ).length;
  const reviewCount = questions.filter(
    (q) => q.reviewStatus === 'sme_review'
  ).length;
  const publishedCount = questions.filter(
    (q) => q.reviewStatus === 'published'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Question Bank
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage AI-generated and published questions
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Generate Questions
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {draftCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reviewCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {publishedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { label: 'All', value: 'all' },
              { label: 'Draft', value: 'draft' },
              { label: 'SME Review', value: 'sme_review' },
              { label: 'Published', value: 'published' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Questions ({filteredQuestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading questions...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <Alert>
              <AlertDescription>
                No questions found matching this filter
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {question.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {question.scenario.substring(0, 100)}...
                      </p>
                    </div>
                    <Badge className={getStatusBadgeColor(question.reviewStatus)}>
                      {question.reviewStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className={`font-semibold ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty.charAt(0).toUpperCase() +
                          question.difficulty.slice(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                      {question.publishedAt && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Published
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedQuestion(question);
                          setShowDetail(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal (simplified) */}
      {showDetail && selectedQuestion && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedQuestion.title}</CardTitle>
                <Badge className="mt-2">
                  {selectedQuestion.reviewStatus}
                </Badge>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowDetail(false)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Scenario</h4>
              <p className="text-sm text-foreground">
                {selectedQuestion.scenario}
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="default">Approve & Publish</Button>
              <Button variant="outline">Request Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
