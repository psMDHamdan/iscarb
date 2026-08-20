"use client";

/**
 * RDF Graph Visualization — interactive SVG-based force-directed graph
 * for student assessment data. Fetches JSON-LD from /api/iscarb/rdf/[studentId]
 * and renders nodes (student, responses, modules, profile, bands) with edges.
 *
 * Zero new dependencies — uses React state for force simulation + SVG rendering.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { authHeaders } from "@/lib/client-auth";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  type: "student" | "response" | "module" | "profile" | "dimension" | "criterion" | "band";
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  data?: Record<string, unknown>;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface RdfGraphVizProps {
  studentId: string;
  className?: string;
}

// ── Color scheme ───────────────────────────────────────────────────────────

const NODE_COLORS: Record<GraphNode["type"], string> = {
  student: "#6366f1",    // indigo
  response: "#f59e0b",   // amber
  module: "#10b981",     // emerald
  profile: "#ec4899",    // pink
  dimension: "#8b5cf6",  // violet
  criterion: "#f97316",  // orange
  band: "#06b6d4",       // cyan
};

const NODE_SHAPES: Record<GraphNode["type"], "circle" | "diamond" | "hexagon"> = {
  student: "circle",
  response: "circle",
  module: "hexagon",
  profile: "diamond",
  dimension: "circle",
  criterion: "circle",
  band: "hexagon",
};

// ── Force simulation (lightweight, no D3) ──────────────────────────────────

function forceSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations = 120,
): GraphNode[] {
  const ns = nodes.map((n) => ({ ...n }));
  const nodeMap = new Map(ns.map((n) => [n.id, n]));
  const cx = width / 2;
  const cy = height / 2;

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;

    // Center gravity
    for (const n of ns) {
      n.vx += (cx - n.x) * 0.01 * alpha;
      n.vy += (cy - n.y) * 0.01 * alpha;
    }

    // Repulsion between all nodes
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const a = ns[i];
        const b = ns[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (800 * alpha) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Attraction along edges
    for (const e of edges) {
      const s = nodeMap.get(e.source);
      const t = nodeMap.get(e.target);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 120) * 0.005 * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    }

    // Apply velocity with damping
    for (const n of ns) {
      n.vx *= 0.6;
      n.vy *= 0.6;
      n.x += n.vx;
      n.y += n.vy;
      // Bounds
      n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x));
      n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y));
    }
  }

  return ns;
}

// ── JSON-LD parser ─────────────────────────────────────────────────────────

function parseJsonLdToGraph(jsonld: Record<string, unknown>): GraphData {
  const graph = (jsonld["@graph"] || []) as Record<string, unknown>[];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let angle = 0;
  const totalNodes = graph.length;
  const spreadRadius = 180;

  for (const node of graph) {
    const id = (node["@id"] as string) || "";
    const typeStr = (node["@type"] as string) || "";

    let type: GraphNode["type"] = "student";
    if (typeStr.includes("AssessmentResponse")) type = "response";
    else if (typeStr.includes("EmployabilityProfile")) type = "profile";
    else if (typeStr.includes("DimensionScore")) type = "dimension";
    else if (typeStr.includes("RubricCriterion")) type = "criterion";
    else if (typeStr.includes("AssessmentModule")) type = "module";

    // Extract label
    let label = id.split("/").pop() || id;
    const nameVal = node["iscarb:hasName"] || node["rdfs:label"];
    if (typeof nameVal === "string") label = nameVal;
    else if (Array.isArray(nameVal) && nameVal.length > 0) {
      const first = nameVal[0];
      label = typeof first === "string" ? first : (first as Record<string, string>)?.["@value"] || label;
    }

    // Score for sizing
    let score = 0;
    const scoreVal = node["iscarb:score"] || node["iscarb:composite"];
    if (typeof scoreVal === "number") score = scoreVal;
    else if (typeof scoreVal === "object" && scoreVal !== null) {
      score = parseFloat((scoreVal as Record<string, string>)?.["@value"] || "0");
    }

    const radius = type === "student" ? 28 : type === "profile" ? 24 : Math.max(12, 8 + score / 10);
    const pos = angle / (totalNodes || 1);
    angle += 1;

    nodes.push({
      id,
      type,
      label: label.length > 24 ? label.slice(0, 22) + "…" : label,
      x: 400 + spreadRadius * Math.cos(pos * Math.PI * 2),
      y: 300 + spreadRadius * Math.sin(pos * Math.PI * 2),
      vx: 0,
      vy: 0,
      radius,
      color: NODE_COLORS[type],
      data: node as Record<string, unknown>,
    });

    // Extract edges from object references
    for (const [key, val] of Object.entries(node)) {
      if (key.startsWith("@") || key.startsWith("iscarb:_")) continue;
      if (typeof val === "object" && val !== null && (val as Record<string, string>)["@id"]) {
        const targetId = (val as Record<string, string>)["@id"];
        if (targetId !== id) {
          edges.push({
            source: id,
            target: targetId,
            label: key.split(":").pop(),
          });
        }
      }
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === "object" && item !== null && (item as Record<string, string>)["@id"]) {
            const targetId = (item as Record<string, string>)["@id"];
            if (targetId !== id) {
              edges.push({
                source: id,
                target: targetId,
                label: key.split(":").pop(),
              });
            }
          }
        }
      }
    }
  }

  return { nodes, edges };
}

// ── Component ──────────────────────────────────────────────────────────────

export function RdfGraphViz({ studentId, className }: RdfGraphVizProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/iscarb/rdf/${studentId}`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const jsonld = await res.json();
      const parsed = parseJsonLdToGraph(jsonld);
      // Run force simulation
      const simulated = forceSimulation(parsed.nodes, parsed.edges, 800, 600);
      setGraphData({ nodes: simulated, edges: parsed.edges });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Pan handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Node lookup for edge rendering
  const nodeMap = useMemo(
    () => new Map((graphData?.nodes || []).map((n) => [n.id, n])),
    [graphData],
  );

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-sm">Knowledge Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-sm">Knowledge Graph</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchGraph}>
            <RefreshCw className="mr-2 h-3 w-3" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Knowledge Graph</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchGraph}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="relative h-[400px] w-full cursor-grab active:cursor-grabbing overflow-hidden rounded-b-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 800 600"
            style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
          >
            {/* Edges */}
            {edges.map((edge, i) => {
              const s = nodeMap.get(edge.source);
              const t = nodeMap.get(edge.target);
              if (!s || !t) return null;
              return (
                <g key={`e-${i}`}>
                  <line
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke="#94a3b8"
                    strokeWidth={1}
                    strokeOpacity={0.4}
                  />
                  {edge.label && (
                    <text
                      x={(s.x + t.x) / 2}
                      y={(s.y + t.y) / 2 - 4}
                      textAnchor="middle"
                      className="fill-muted-foreground"
                      fontSize={8}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => (
              <motion.g
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: Math.random() * 0.3, duration: 0.4 }}
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={node.color}
                  fillOpacity={selectedNode?.id === node.id ? 1 : 0.8}
                  stroke={selectedNode?.id === node.id ? "#fff" : "none"}
                  strokeWidth={selectedNode?.id === node.id ? 3 : 0}
                />
                <text
                  x={node.x}
                  y={node.y + node.radius + 12}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize={9}
                  fontWeight={node.type === "student" ? 600 : 400}
                >
                  {node.label}
                </text>
              </motion.g>
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 rounded-md bg-background/80 px-2 py-1 backdrop-blur">
            {(Object.entries(NODE_COLORS) as [string, string][]).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] capitalize text-muted-foreground">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected node detail */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t"
            >
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                  <span className="text-xs font-semibold">{selectedNode.label}</span>
                  <Badge variant="outline" className="text-[10px]">{selectedNode.type}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                  {selectedNode.data && Object.entries(selectedNode.data)
                    .filter(([k]) => !k.startsWith("@") && typeof selectedNode.data![k] !== "object")
                    .slice(0, 8)
                    .map(([k, v]) => (
                      <div key={k}>
                        <span className="font-medium">{k.split(":").pop()}:</span>{" "}
                        {String(v).slice(0, 60)}
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
