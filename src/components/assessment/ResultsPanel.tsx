// Assessment Results Display Component
// src/components/assessment/ResultsPanel.tsx

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Download, TrendingUp, Star, AlertCircle } from 'lucide-react';

interface PerCriterionScore {
  criterion: string;
  scoreGiven: number;
  maxScore: number;
  weight: number;
  reasoning: string;
}

interface DimensionalScores {
  'core-professionalism': number;
  'business-digital': number;
  'job-fit-technical': number;
  'growth-potential': number;
  composite: number;
}

interface ResultsPanelProps {
  score: number;
  confidenceScore: number;
  perCriterion: PerCriterionScore[];
  feedback: string;
  strengths: string[];
  improvements: string[];
  dimensionalScores: DimensionalScores;
  pdfUrl?: string;
  onDownloadPDF?: () => void;
}

function getScoreBand(score: number): {
  name: string;
  color: string;
  description: string;
} {
  if (score >= 80) return { name: 'Strong', color: 'bg-green-100 text-green-900', description: 'Meets and exceeds expectations' };
  if (score >= 60) return { name: 'Proficient', color: 'bg-blue-100 text-blue-900', description: 'Meets expectations' };
  if (score >= 40) return { name: 'Developing', color: 'bg-yellow-100 text-yellow-900', description: 'Emerging skills' };
  return { name: 'Weak', color: 'bg-red-100 text-red-900', description: 'Needs improvement' };
}

export function ResultsPanel({
  score,
  confidenceScore,
  perCriterion,
  feedback,
  strengths,
  improvements,
  dimensionalScores,
  pdfUrl,
  onDownloadPDF,
}: ResultsPanelProps) {
  const band = getScoreBand(score);

  // Prepare 4D chart data
  const dimensionalData = [
    {
      dimension: 'Core Prof.',
      value: dimensionalScores['core-professionalism'],
      fullMark: 100,
    },
    {
      dimension: 'Business',
      value: dimensionalScores['business-digital'],
      fullMark: 100,
    },
    {
      dimension: 'Job-Fit',
      value: dimensionalScores['job-fit-technical'],
      fullMark: 100,
    },
    {
      dimension: 'Growth',
      value: dimensionalScores['growth-potential'],
      fullMark: 100,
    },
  ];

  // Prepare criterion scores for bar chart
  const criterionData = perCriterion.map((c) => ({
    name: c.criterion.substring(0, 12),
    score: (c.scoreGiven / c.maxScore) * 100,
    fullName: c.criterion,
  }));

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card className="border-2 border-primary">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl font-bold text-foreground mb-2">
                {score}/100
              </CardTitle>
              <Badge className={band.color}>{band.name}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                AI Confidence Score
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-full rounded-full"
                  style={{
                    width: `${confidenceScore * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(confidenceScore * 100)}% confident in this score
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {band.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4D Dimensional Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            4D Competency Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={dimensionalData}>
                  <PolarGrid stroke="hsl(var(--muted-foreground))" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-3">
              {dimensionalData.map((d) => (
                <div key={d.dimension} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold">{d.dimension}</p>
                    <p className="text-sm font-bold text-primary">
                      {Math.round(d.value)}%
                    </p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${d.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Criterion Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Criterion Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {perCriterion.length > 3 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={criterionData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                      formatter={(value) => `${Math.round(value as number)}%`}
                      labelFormatter={(label) =>
                        criterionData.find((d) => d.name === label)?.fullName || label
                      }
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="space-y-3">
                {perCriterion.map((c, idx) => (
                  <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-foreground">
                        {c.criterion}
                      </h3>
                      <Badge>{Math.round((c.scoreGiven / c.maxScore) * 100)}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {c.scoreGiven} / {c.maxScore} points (Weight: {Math.round(c.weight * 100)}%)
                    </p>
                    <p className="text-sm text-foreground">{c.reasoning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground whitespace-pre-wrap">{feedback}</p>
        </CardContent>
      </Card>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Star className="w-5 h-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {strengths.map((strength, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-foreground">
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    ✓
                  </span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertCircle className="w-5 h-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {improvements.map((improvement, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-foreground">
                  <span className="text-orange-600 dark:text-orange-400 font-bold">
                    →
                  </span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* PDF Download */}
      <Button
        onClick={async () => {
          try {
            // Call PDF export API
            const response = await fetch(
              `/api/assessment/${typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('submissionId') || 'unknown' : 'unknown'}/export-pdf`
            );
            if (response.ok) {
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `assessment-report-${new Date().toISOString().split('T')[0]}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } else {
              alert('Failed to generate PDF');
            }
          } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Error downloading PDF');
          }
        }}
        size="lg"
        className="w-full"
        variant="outline"
      >
        <Download className="w-4 h-4 mr-2" />
        Download Full Report (PDF)
      </Button>
    </div>
  );
}
