"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Download, ZoomIn, ZoomOut, Maximize2, RefreshCw } from "lucide-react";
import { useApp } from "@/lib/store";

// Dynamically import vis-network to avoid SSR issues with canvas
async function getNetwork() {
  try {
    const mod = await import("vis-network/standalone/esm/vis-network.mjs");
    return mod.Network;
  } catch (e) {
    console.error("Failed to load vis-network:", e);
    throw e;
  }
}

export function OntologyMap() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchOntologyData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Classes
      const classRes = await fetch("/api/v1/triple-store/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sparql: `SELECT ?class ?label WHERE {
            ?class rdf:type <http://www.w3.org/2002/07/owl#Class> .
            OPTIONAL { ?class <http://www.w3.org/2000/01/rdf-schema#label> ?label }
          }`,
        }),
      });
      const classData = await classRes.json();

      // 2. Fetch Subclass relations
      const subClassRes = await fetch("/api/v1/triple-store/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sparql: `SELECT ?class ?parent WHERE {
            ?class <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?parent .
          }`,
        }),
      });
      const subClassData = await subClassRes.json();

      // 3. Fetch Object Properties (Relationships)
      const propRes = await fetch("/api/v1/triple-store/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sparql: `SELECT ?prop ?label ?domain ?range WHERE {
            ?prop rdf:type <http://www.w3.org/2002/07/owl#ObjectProperty> .
            ?prop <http://www.w3.org/2000/01/rdf-schema#domain> ?domain .
            ?prop <http://www.w3.org/2000/01/rdf-schema#range> ?range .
            OPTIONAL { ?prop <http://www.w3.org/2000/01/rdf-schema#label> ?label }
          }`,
        }),
      });
      const propData = await propRes.json();

      if (!classData.success || !subClassData.success || !propData.success) {
        throw new Error("Failed to execute one or more SPARQL queries");
      }

      // Build Nodes
      const nodesMap = new Map();
      classData.data.results.bindings.forEach((b: any) => {
        const uri = b.class.value;
        const name = uri.split("#")[1] || uri.split("/").pop();
        nodesMap.set(uri, {
          id: uri,
          label: b.label?.value || name,
          title: uri,
          color: "#3B82F6", // Blue for classes
          font: { size: 14, face: "Inter" },
          shape: "box",
          margin: 10,
        });
      });

      // We might have properties whose domain/range aren't explicitly defined as classes above
      // Add them as implicit nodes just in case
      propData.data.results.bindings.forEach((b: any) => {
        const domainUri = b.domain.value;
        const rangeUri = b.range.value;
        if (!nodesMap.has(domainUri)) {
          const name = domainUri.split("#")[1] || domainUri.split("/").pop();
          nodesMap.set(domainUri, { id: domainUri, label: name, color: "#9CA3AF", shape: "box", margin: 10 });
        }
        if (!nodesMap.has(rangeUri)) {
          const name = rangeUri.split("#")[1] || rangeUri.split("/").pop();
          nodesMap.set(rangeUri, { id: rangeUri, label: name, color: "#9CA3AF", shape: "box", margin: 10 });
        }
      });

      const nodes = Array.from(nodesMap.values());

      // Build Edges
      const edges = [];
      let edgeId = 0;

      // Subclass edges (dashed lines)
      subClassData.data.results.bindings.forEach((b: any) => {
        if (nodesMap.has(b.class.value) && nodesMap.has(b.parent.value)) {
          edges.push({
            id: `e_${edgeId++}`,
            from: b.class.value,
            to: b.parent.value,
            label: "subClassOf",
            arrows: "to",
            color: { color: "#9CA3AF" },
            dashes: true,
            font: { size: 10, align: "middle" },
          });
        }
      });

      // Object properties (solid lines)
      propData.data.results.bindings.forEach((b: any) => {
        const propUri = b.prop.value;
        const name = b.label?.value || propUri.split("#")[1] || propUri.split("/").pop();
        edges.push({
          id: `e_${edgeId++}`,
          from: b.domain.value,
          to: b.range.value,
          label: name,
          arrows: "to",
          color: { color: "#10B981" }, // Green for object properties
          font: { size: 11, align: "middle", color: "#059669", background: "white" },
          smooth: { type: "curvedCW", roundness: 0.2 },
        });
      });

      renderGraph(nodes, edges);
    } catch (err: any) {
      setError(err.message || "Failed to load ontology data");
    } finally {
      setLoading(false);
    }
  };

  const renderGraph = async (nodes: any[], edges: any[]) => {
    if (!containerRef.current) return;
    
    const Net = await getNetwork();
    const data = { nodes, edges };
    
    const options = {
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -100,
          centralGravity: 0.01,
          springLength: 150,
          springConstant: 0.08,
        },
        stabilization: { iterations: 150 },
      },
      interaction: {
        navigationButtons: true,
        keyboard: true,
        zoomView: true,
        dragView: true,
        hover: true,
      },
      edges: {
        width: 1.5,
      },
    };

    const netInstance = new Net(containerRef.current, data, options);
    setNetwork(netInstance);
  };

  useEffect(() => {
    fetchOntologyData();
  }, []);

  const handleZoomIn = () => network && network.moveTo({ scale: network.getScale() * 1.2 });
  const handleZoomOut = () => network && network.moveTo({ scale: network.getScale() / 1.2 });
  const handleFitView = () => network && network.fit({ animation: { duration: 800, easingFunction: "easeInOutQuad" } });

  const handleDownload = () => {
    if (network) {
      const canvas = network.canvas.frame.canvas;
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "ontology-map.png";
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={handleZoomIn} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded text-sm transition-colors">
          <ZoomIn className="h-4 w-4" /> {ar ? "تكبير" : "Zoom In"}
        </button>
        <button onClick={handleZoomOut} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded text-sm transition-colors">
          <ZoomOut className="h-4 w-4" /> {ar ? "تصغير" : "Zoom Out"}
        </button>
        <button onClick={handleFitView} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded text-sm transition-colors">
          <Maximize2 className="h-4 w-4" /> {ar ? "ملاءمة الشاشة" : "Fit View"}
        </button>
        <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded text-sm transition-colors">
          <Download className="h-4 w-4" /> {ar ? "تنزيل صورة" : "Export PNG"}
        </button>
        <button onClick={fetchOntologyData} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm transition-colors ml-auto">
          <RefreshCw className="h-4 w-4" /> {ar ? "تحديث" : "Refresh"}
        </button>
      </div>

      <div className="relative bg-white border rounded-xl overflow-hidden shadow-sm h-[600px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-50/90">
            <div className="text-center p-6">
              <p className="text-red-600 font-medium mb-2">{error}</p>
              <button onClick={fetchOntologyData} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm transition-colors">
                {ar ? "حاول مرة أخرى" : "Try Again"}
              </button>
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full focus:outline-none" />
      </div>

      <div className="flex gap-4 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>{ar ? "فئة (Class)" : "Class"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0 border-t-2 border-dashed border-gray-400" />
          <span>subClassOf</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0 border-t-2 border-green-500" />
          <span>Object Property</span>
        </div>
      </div>
    </div>
  );
}
