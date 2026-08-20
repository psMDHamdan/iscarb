"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

export function CompetenciesCompetencyRadarView() {
  const { data: rawRes, isLoading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "competencies", "radar"],
    "/api/v1/student/competencies/radar",
  );
  const data = rawRes?.data ?? null;
  const error = queryError ? queryError.message : null;
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState(false);

  const handleLevelChange = (competencyId, value) => {
    setEditing((prev) => ({
      ...prev,
      [competencyId]: value,
    }));
  };

  const handleSave = async (competencyId) => {
    try {
      setSaving(true);
      const currentLevel = editing[competencyId] || 0;

      const res = await fetch("/api/v1/student/competencies/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competencyId,
          currentLevel,
        }),
      });

      if (!res.ok) throw new Error("Failed to save assessment");

      // Refresh data
      await refetch();
      setEditing({});
    } catch (err) {
      console.error("Failed to save assessment:", err);
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Competency Assessment</h1>
        <p className="text-gray-600 mt-2">Visual assessment of your competencies</p>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Competency Radar</CardTitle>
          <CardDescription>Your proficiency levels across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={data.radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Current Level" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Competency Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Self-Assessment</CardTitle>
          <CardDescription>Rate your proficiency level for each competency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.competencies.map((comp) => (
              <div key={comp.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium">{comp.name}</h4>
                    <p className="text-sm text-gray-600">{comp.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{editing[comp.id] ?? comp.level}%</div>
                    <div className="text-xs text-gray-500">Target: {comp.target}%</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[editing[comp.id] ?? comp.level]}
                    onValueChange={(val) => handleLevelChange(comp.id, val[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {editing[comp.id] !== undefined && (
                  <Button
                    onClick={() => handleSave(comp.id)}
                    disabled={saving}
                    className="mt-4 w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Assessment
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
