// Analytics Dashboard Component
// Admin analytics with charts for assessment data
// src/components/admin/AnalyticsDashboard.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { TrendingUp, Users, Award, Target } from 'lucide-react';

interface AnalyticsData {
  totalAssessments: number;
  averageScore: number;
  passRate: number;
  totalCost: number;
  moduleData: Array<{
    module: string;
    completions: number;
    averageScore: number;
  }>;
  scoreDistribution: Array<{
    range: string;
    count: number;
  }>;
  calibrationData: Array<{
    aiScore: number;
    humanScore: number;
    deviation: number;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/analytics?timeRange=${timeRange}`);
      const data = await res.json();
      if (data.success) {
        setData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-600">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Platform-wide assessment metrics and trends
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assessments
              </CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {data.totalAssessments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Score
              </CardTitle>
              <Award className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {data.averageScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform average /100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pass Rate
              </CardTitle>
              <Target className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {data.passRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Score ≥ 60
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cost
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ${data.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI operations cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Completion by Module */}
      <Card>
        <CardHeader>
          <CardTitle>Assessments Completed by Module</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.moduleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="module" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completions" fill="#3b82f6" name="Completions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score Distribution & Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Histogram */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  fill="#3b82f6"
                  stroke="#3b82f6"
                  name="Student Count"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI vs Human Calibration */}
        <Card>
          <CardHeader>
            <CardTitle>AI vs Human Calibration</CardTitle>
            <p className="text-xs text-muted-foreground mt-2">
              Comparing AI scores to human review scores
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="aiScore" name="AI Score" />
                <YAxis type="number" dataKey="humanScore" name="Human Score" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                  name="Score Comparison"
                  data={data.calibrationData}
                  fill="#3b82f6"
                />
                {/* Perfect fit line */}
                <Scatter
                  name="Perfect Agreement"
                  data={[
                    { aiScore: 0, humanScore: 0 },
                    { aiScore: 100, humanScore: 100 },
                  ]}
                  fill="none"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Calibration Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Calibration Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.calibrationData.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    Mean Absolute Deviation
                  </p>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {(
                        data.calibrationData.reduce((sum, d) => sum + d.deviation, 0) /
                        data.calibrationData.length
                      ).toFixed(1)} points
                    </p>
                    <Badge
                      className={
                        (
                          data.calibrationData.reduce((sum, d) => sum + d.deviation, 0) /
                          data.calibrationData.length
                        ) < 15
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {(
                        data.calibrationData.reduce((sum, d) => sum + d.deviation, 0) /
                        data.calibrationData.length
                      ) < 15
                        ? 'Within Target'
                        : 'Needs Review'}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: Mean deviation &lt; 15 points (per specification)
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manual Review Queue (Placeholder) */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="text-yellow-900 dark:text-yellow-100">
            Manual Review Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Assessments flagged for human intervention will appear here.
            Currently: 0 assessments pending review.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
