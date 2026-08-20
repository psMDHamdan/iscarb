"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Award, Target } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

export function CompetenciesCompetencyOverviewView() {
  const { data: rawData, isLoading, error: queryError } = useApiQuery<any>(
    ["student", "competencies", "overview"],
    "/api/v1/student/competencies/overview",
  );

  const data = rawData?.data ?? rawData ?? null;
  const error = queryError ? queryError.message : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error</CardTitle>
        </CardHeader>
        <CardContent className="text-red-600">{error}</CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Competency Overview</h1>
        <p className="text-gray-600 mt-2">Your comprehensive competency dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Competencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">In framework</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" /> Assessed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.assessed}</div>
            <p className="text-xs text-gray-500 mt-1">{data.stats.completionRate}% complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Avg Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.avgMastery}%</div>
            <p className="text-xs text-gray-500 mt-1">Across all</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" /> Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.completionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Of framework</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="radar" className="w-full">
        <TabsList>
          <TabsTrigger value="radar">By Category</TabsTrigger>
          <TabsTrigger value="competencies">All Competencies</TabsTrigger>
        </TabsList>

        <TabsContent value="radar">
          <Card>
            <CardHeader>
              <CardTitle>Competency Levels by Category</CardTitle>
              <CardDescription>Average proficiency level per category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.radarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies">
          <Card>
            <CardHeader>
              <CardTitle>All Competencies</CardTitle>
              <CardDescription>Your current vs target levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.competencies.map((comp) => (
                  <div key={comp.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{comp.name}</h4>
                      <p className="text-sm text-gray-600">{comp.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{comp.currentLevel}%</div>
                        <div className="text-xs text-gray-500">Current</div>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(comp.currentLevel / comp.targetLevel) * 100}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-600">{comp.targetLevel}%</div>
                        <div className="text-xs text-gray-500">Target</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
