"use client";

import { useEffect, useState } from "react";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Network, ZoomIn, ZoomOut, Info } from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  title: string;
  icon: string;
  color: string;
  size: number;
  viewCount: number;
  articleCount: number;
  category: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    displayedNodes: number;
    displayedEdges: number;
  };
}

export function KnowledgeKnowledgeGraphView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [depth, setDepth] = useState("2");

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/student/knowledge/graph?depth=${depth}`);
        if (!response.ok) throw new Error("Failed to fetch graph");
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [depth]);

  if (loading) {
    return (
      <StudentPageTemplate
        title={ar ? "الرسم البياني للمعرفة" : "Knowledge Graph"}
        apiEndpoint="/api/v1/student/knowledge/graph"
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/student" },
          { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
          { label: ar ? "الرسم البياني" : "Graph", href: "/student/knowledge/graph" },
        ]}
      >
        {() => (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        )}
      </StudentPageTemplate>
    );
  }

  if (error) {
    return (
      <StudentPageTemplate
        title={ar ? "الرسم البياني للمعرفة" : "Knowledge Graph"}
        apiEndpoint="/api/v1/student/knowledge/graph"
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/student" },
          { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
          { label: ar ? "الرسم البياني" : "Graph", href: "/student/knowledge/graph" },
        ]}
      >
        {() => (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}
      </StudentPageTemplate>
    );
  }

  return (
    <StudentPageTemplate
      title={ar ? "الرسم البياني للمعرفة" : "Knowledge Graph"}
      description={ar ? "استكشف العلاقات بين الموضوعات" : "Explore relationships between topics"}
      apiEndpoint="/api/v1/student/knowledge/graph"
      breadcrumbs={[
        { label: ar ? "الرئيسية" : "Home", href: "/student" },
        { label: ar ? "المعرفة" : "Knowledge", href: "/student/knowledge" },
        { label: ar ? "الرسم البياني" : "Graph", href: "/student/knowledge/graph" },
      ]}
    >
      {() => (
        <div className="space-y-6">
          {/* Controls */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-medium block mb-2">{ar ? "عمق الرسم البياني" : "Graph Depth"}</label>
                <Select value={depth} onValueChange={setDepth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 level</SelectItem>
                    <SelectItem value="2">2 levels</SelectItem>
                    <SelectItem value="3">3 levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  {Math.round(zoom * 100)}%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              <div className="md:col-span-2 text-right text-sm text-muted-foreground">
                {data?.stats.displayedNodes || 0} {ar ? "عقدة" : "nodes"}, {data?.stats.displayedEdges || 0} {ar ? "اتصال" : "connections"}
              </div>
            </div>
          </Card>

          {/* Graph Visualization Placeholder */}
          <Card className="p-6 min-h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            <div className="text-center">
              <Network className="w-16 h-16 mx-auto text-muted-foreground opacity-30 mb-4" />
              <p className="text-muted-foreground mb-4">
                {ar ? "مستعرض الرسم البياني التفاعلي" : "Interactive Graph Visualization"}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
                {data?.nodes.slice(0, 8).map((node) => (
                  <div
                    key={node.id}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedNode(node)}
                  >
                    <div className="text-2xl mb-1">{node.icon}</div>
                    <p className="text-xs font-medium line-clamp-2">{node.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Node Details */}
          {selectedNode && (
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <span className="text-2xl">{selectedNode.icon}</span>
                    {selectedNode.label}
                  </h3>
                  <Badge className="mt-2">{selectedNode.category}</Badge>
                </div>
                <Button variant="outline" onClick={() => setSelectedNode(null)}>
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "المقالات" : "Articles"}</p>
                  <p className="text-2xl font-bold">{selectedNode.articleCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "المشاهدات" : "Views"}</p>
                  <p className="text-2xl font-bold">{selectedNode.viewCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{ar ? "الاتصالات" : "Connections"}</p>
                  <p className="text-2xl font-bold">
                    {data?.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length || 0}
                  </p>
                </div>
              </div>

              <Link href={`/student/knowledge/articles?topic=${selectedNode.id}`}>
                <Button className="w-full">
                  {ar ? "عرض المقالات" : "View Articles"}
                </Button>
              </Link>
            </Card>
          )}

          {/* Legend */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {ar ? "الأسطورة" : "Legend"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500" />
                <span className="text-sm">{ar ? "حجم العقدة = عدد المشاهدات" : "Node size = popularity"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500" />
                <span className="text-sm">{ar ? "اللون = الفئة" : "Color = category"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-0.5 bg-gray-400" />
                <span className="text-sm">{ar ? "الخطوط = العلاقات" : "Lines = relationships"}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </StudentPageTemplate>
  );
}
