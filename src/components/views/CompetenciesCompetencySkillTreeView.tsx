"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ChevronDown, ChevronRight } from "lucide-react";

export function CompetenciesCompetencySkillTreeView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [viewMode, setViewMode] = useState("tree");

  useEffect(() => {
    fetchSkillTree();
  }, []);

  const fetchSkillTree = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/student/competencies/skill-tree");
      if (!res.ok) throw new Error("Failed to fetch skill tree");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const getStatusColor = (status) => {
      switch (status) {
        case "completed":
          return "bg-green-100 text-green-800";
        case "in_progress":
          return "bg-blue-100 text-blue-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-0 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          <div className="flex-1">
            <h4 className="font-medium">{node.name}</h4>
            <p className="text-xs text-gray-600">{node.category}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{node.level}%</span>
            <Badge variant="outline" className={getStatusColor(node.status)}>
              {node.status}
            </Badge>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
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

  const categoryStats = data.skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = { total: 0, completed: 0 };
    }
    acc[skill.category].total++;
    if (skill.status === "completed") {
      acc[skill.category].completed++;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Skill Tree</h1>
        <p className="text-gray-600 mt-2">Hierarchical view of your skills and development</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "tree" ? "default" : "outline"}
          onClick={() => setViewMode("tree")}
        >
          Tree View
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          onClick={() => setViewMode("list")}
        >
          List View
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(categoryStats).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.skills.filter((s) => s.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {viewMode === "tree" ? (
        <Card>
          <CardHeader>
            <CardTitle>Skill Hierarchy</CardTitle>
            <CardDescription>Click to expand skill trees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.tree.map((node) => renderTreeNode(node))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Skills</CardTitle>
            <CardDescription>Complete list of your skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{skill.name}</h4>
                    <p className="text-sm text-gray-600">{skill.category}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className={
                        skill.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }
                    >
                      {skill.status}
                    </Badge>
                    <div className="text-right">
                      <div className="text-lg font-bold">{skill.level}%</div>
                      <div className="text-xs text-gray-500">
                        {skill.endorsementCount} endorsements
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
