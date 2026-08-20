"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, CheckCircle2, Circle, Calendar } from "lucide-react";

export function CompetenciesCompetencyRoadmapView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("timeline");

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/student/competencies/roadmap");
      if (!res.ok) throw new Error("Failed to fetch roadmap");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Development Roadmap</h1>
        <p className="text-gray-600 mt-2">Your path to competency mastery</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.progress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${data.stats.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "timeline" ? "default" : "outline"}
          onClick={() => setViewMode("timeline")}
        >
          Timeline
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          onClick={() => setViewMode("list")}
        >
          List View
        </Button>
      </div>

      {/* Timeline View */}
      {viewMode === "timeline" && (
        <Card>
          <CardHeader>
            <CardTitle>Milestone Timeline</CardTitle>
            <CardDescription>Your development milestones organized by quarter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {Object.entries(data.grouped).map(([period, milestones]) => (
                <div key={period}>
                  <h3 className="font-bold text-lg mb-4 text-blue-600">{period}</h3>
                  <div className="space-y-3">
                    {milestones.map((milestone) => (
                      <div key={milestone.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          {milestone.status === "completed" ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-400" />
                          )}
                          <div className="w-0.5 h-12 bg-gray-300 mt-2" />
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{milestone.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                            </div>
                            <Badge className={getPriorityColor(milestone.priority)}>
                              {milestone.priority}
                            </Badge>
                          </div>
                          <div className="flex gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(milestone.targetDate).toLocaleDateString()}
                            </span>
                            {milestone.completedDate && (
                              <span className="text-green-600">
                                Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>All Milestones</CardTitle>
            <CardDescription>Complete list of your development goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.milestones.map((milestone) => (
                <div key={milestone.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="font-medium">{milestone.title}</h4>
                        <p className="text-sm text-gray-600">{milestone.category}</p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(milestone.priority)}>
                      {milestone.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 ml-8 mb-2">{milestone.description}</p>
                  <div className="ml-8 flex items-center justify-between text-xs text-gray-500">
                    <span>Target: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                    <div className="text-right">
                      <div className="font-medium text-gray-700">{milestone.progress}%</div>
                      <div className="w-32 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Milestone */}
      {data.nextMilestone && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-bold text-lg mb-2">{data.nextMilestone.title}</h3>
            <p className="text-gray-700 mb-4">{data.nextMilestone.description}</p>
            <div className="flex justify-between text-sm">
              <span>Target Date: {new Date(data.nextMilestone.targetDate).toLocaleDateString()}</span>
              <Button>Get Started</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
