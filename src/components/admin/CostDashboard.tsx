// Cost Dashboard Component
// Displays monthly AI spending and budget tracking
// src/components/admin/CostDashboard.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign, Zap } from 'lucide-react';

interface CostData {
  totalSpent: number;
  projectedTotal: number;
  budget: number;
  percentageOfBudget: string;
  byAgent: Record<string, number>;
  byModel: Record<string, number>;
  assessmentCount: number;
  averageCostPerAssessment: string;
  breakdown: {
    questionGeneration: number;
    scoring: number;
    embeddings: number;
  };
}

export function CostDashboard() {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchCostData();
  }, [month, year]);

  const fetchCostData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/costs/monthly?month=${month}&year=${year}`
      );
      const data = await res.json();
      if (data.success) {
        setCostData(data);
      }
    } catch (error) {
      console.error('Failed to fetch cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading cost data...</div>;
  }

  if (!costData) {
    return <div className="text-red-600">Failed to load cost data</div>;
  }

  const budgetPercentage = parseFloat(costData.percentageOfBudget);
  const isOverBudget = budgetPercentage > 100;
  const isWarning = budgetPercentage > 80;

  // Prepare chart data
  const agentData = Object.entries(costData.byAgent).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value: value,
  }));

  const modelData = Object.entries(costData.byModel).map(([name, value]) => ({
    name,
    value,
  }));

  const breakdownData = [
    {
      name: 'Question Generation',
      value: costData.breakdown.questionGeneration,
    },
    { name: 'Scoring', value: costData.breakdown.scoring },
    { name: 'Embeddings', value: costData.breakdown.embeddings },
  ];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Budget Alert */}
      {isOverBudget && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Budget exceeded! You&apos;ve spent ${costData.totalSpent.toFixed(2)} out of ${costData.budget.toFixed(2)} ({budgetPercentage.toFixed(0)}%)
          </AlertDescription>
        </Alert>
      )}

      {isWarning && !isOverBudget && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Approaching budget limit. {budgetPercentage.toFixed(0)}% of monthly budget used.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${costData.totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${costData.budget.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {budgetPercentage.toFixed(0)}%
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cost per Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${costData.averageCostPerAssessment}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {costData.assessmentCount} assessments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projection */}
      {costData.projectedTotal > costData.budget && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Based on current spending, you&apos;re projected to spend ${costData.projectedTotal.toFixed(2)} this month
          </AlertDescription>
        </Alert>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Agent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Spending by Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: $${value.toFixed(2)}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Model Comparison */}
      {modelData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {modelData.map((model) => {
                const percentage = (model.value / costData.totalSpent) * 100;
                return (
                  <div key={model.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm">{model.name}</p>
                      <Badge variant="secondary">
                        ${model.value.toFixed(2)} ({percentage.toFixed(1)}%)
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month/Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">View Different Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('default', {
                    month: 'long',
                  })}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              {Array.from({ length: 3 }, (_, i) => year - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
