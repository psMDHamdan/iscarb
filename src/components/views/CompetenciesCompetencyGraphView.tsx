"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/hooks/use-api-query";

export function CompetenciesCompetencyGraphView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading, error: queryError } = useApiQuery<any>(
    ["student", "competencies", "graph"],
    "/api/v1/student/competencies/graph",
  );
  const data = rawRes?.data ?? null;
  const error = queryError ? queryError.message : null;
  const [selectedNode, setSelectedNode] = useState(null);
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (data && containerRef.current && !networkRef.current) {
      initializeNetwork();
    }
  }, [data]);

  const initializeNetwork = async () => {
    if (!data || !containerRef.current) return;

    try {
      const { Network } = await import("vis-network");

      const nodes = data.nodes.map((node) => {
        const level = node.level || 0;
        let color = "#ef4444";
        if (level >= 80) color = "#22c55e";
        else if (level >= 50) color = "#eab308";

        return {
          id: node.id,
          label: node.label,
          title: `${node.label} (${node.category})\nLevel: ${level}%`,
          color: {
            background: color,
            border: "#fff",
            highlight: {
              background: color,
              border: "#000",
            },
          },
          font: { color: "#fff", size: 12, face: "Arial" },
          size: Math.max(25, Math.min(60, level / 2 + 25)),
          physics: true,
          shape: "dot",
        };
      });

      const edges = (data.edges || []).map((edge, idx) => ({
        id: `edge-${idx}`,
        from: edge.from,
        to: edge.to,
        arrows: "to",
        color: { color: "#bfbfbf", highlight: "#666" },
        smooth: { type: "continuous" },
        physics: true,
      }));

      const options = {
        physics: {
          enabled: true,
          barnesHut: {
            gravitationalConstant: -26000,
            centralGravity: 0.005,
            springLength: 200,
            springConstant: 0.04,
          },
          maxVelocity: 50,
          solver: "barnesHut",
          timestep: 0.35,
          stabilization: { iterations: 150 },
        },
        layout: {
          randomSeed: 42,
        },
        interaction: {
          navigationButtons: true,
          keyboard: true,
          zoomView: true,
          dragView: true,
        },
        nodes: {
          physics: true,
        },
      };

      const network = new Network(containerRef.current, { nodes, edges }, options);

      network.on("click", (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = data.nodes.find((n) => n.id === nodeId);
          if (node) {
            setSelectedNode({
              id: nodeId,
              label: node.label,
              level: node.level,
              category: node.category,
              evidenceCount: node.evidenceCount || 0,
            });
          }
        } else {
          setSelectedNode(null);
        }
      });

      networkRef.current = network;
    } catch (err) {
      console.error("Failed to initialize Network:", err);
    }
  };

  const handleZoomIn = () => {
    if (networkRef.current) {
      networkRef.current.zoom(networkRef.current.getScale() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      networkRef.current.zoom(networkRef.current.getScale() / 1.2);
    }
  };

  const handleFitView = () => {
    if (networkRef.current) {
      networkRef.current.fit();
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="text-center p-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">{ar ? "خطأ" : "Error"}</CardTitle>
        </CardHeader>
        <CardContent className="text-red-600">{error}</CardContent>
      </Card>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{ar ? "لا توجد كفاءات للعرض" : "No Competencies to Display"}</CardTitle>
        </CardHeader>
        <CardContent>{ar ? "ابدأ في إضافة أدلة الكفاءة لتصور رسم البياني المعرفي الخاص بك" : "Start adding competency evidence to visualize your knowledge graph."}</CardContent>
      </Card>
    );
  }

  const getColorForLevel = (level) => {
    if (level >= 80) return "bg-green-100 border-green-300";
    if (level >= 50) return "bg-yellow-100 border-yellow-300";
    return "bg-red-100 border-red-300";
  };

  const getLevelBadgeColor = (level) => {
    if (level >= 80) return "default";
    if (level >= 50) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{ar ? "الرسم البياني المعرفي" : "Knowledge Graph"}</h1>
        <p className="text-gray-600 mt-2">{ar ? "تصور علاقات كفاءاتك" : "Visualize your competency relationships"}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Graph Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    {ar ? "شبكة الكفاءات" : "Competency Network"}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomIn} title={ar ? "تكبير" : "Zoom in"}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomOut} title={ar ? "تصغير" : "Zoom out"}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleFitView} title={ar ? "ملاءمة العرض" : "Fit view"}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{ar ? "العلاقات بين الكفاءات" : "Relationships between competencies"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={containerRef}
                className="w-full h-96 bg-gray-50 rounded-lg border"
                style={{ backgroundColor: "#f9fafb" }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Legend & Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "المفتاح" : "Legend"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span className="text-sm">{ar ? "متقدم (80%+)" : "Advanced (80%+)"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span className="text-sm">{ar ? "متوسط (50-79%)" : "Intermediate (50-79%)"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-sm">{ar ? "مبتدئ (<50%)" : "Beginner (<50%)"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ar ? "الإحصائيات" : "Statistics"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{ar ? "إجمالي العقد" : "Total Nodes"}</span>
                <span className="font-medium">{data.nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{ar ? "الاتصالات" : "Connections"}</span>
                <span className="font-medium">{data.edges?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{ar ? "الفئات" : "Categories"}</span>
                <span className="font-medium">{data.categories?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Nodes List */}
      <Card>
        <CardHeader>
          <CardTitle>{ar ? "الكفاءات" : "Competencies"}</CardTitle>
          <CardDescription>{ar ? "انقر لعرض التفاصيل" : "Click to view details"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.nodes.map((node) => (
              <div
                key={node.id}
                onClick={() =>
                  setSelectedNode({
                    id: node.id,
                    label: node.label,
                    level: node.level,
                    category: node.category,
                    evidenceCount: node.evidenceCount || 0,
                  })
                }
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getColorForLevel(node.level)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm line-clamp-2">{node.label}</h4>
                  <Badge variant={getLevelBadgeColor(node.level)} className="ml-2 flex-shrink-0">
                    {node.level}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2">{node.category}</p>
                <div className="w-full bg-gray-300 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${node.level}%`,
                      backgroundColor: node.level >= 80 ? "#22c55e" : node.level >= 50 ? "#eab308" : "#ef4444",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedNode.label}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">{ar ? "الفئة" : "Category"}</p>
                <p className="font-medium">{selectedNode.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{ar ? "المستوى الحالي" : "Current Level"}</p>
                <p className="font-medium">{selectedNode.level}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{ar ? "عدد الأدلة" : "Evidence Count"}</p>
                <p className="font-medium">{selectedNode.evidenceCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
