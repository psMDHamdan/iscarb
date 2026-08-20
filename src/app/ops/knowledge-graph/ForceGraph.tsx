"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";

export default function ForceGraph({ data }: { data: any }) {
  const fgRef = useRef<any>();
  const [hoverNode, setHoverNode] = useState<any>(null);

  useEffect(() => {
    if (fgRef.current && data?.nodes?.length) {
      setTimeout(() => {
        fgRef.current.d3Force('charge').strength(-400);
        fgRef.current.zoomToFit(800, 50);
      }, 800);
    }
  }, [data]);

  const getNodeColor = (group: string) => {
    switch (group?.toLowerCase()) {
      case "student": return "#6366f1"; // Indigo
      case "course": return "#ec4899"; // Pink
      case "enrollment": return "#8b5cf6"; // Violet
      case "aitutoringsession": return "#14b8a6"; // Teal
      case "grade": return "#f59e0b"; // Amber
      case "literal": return "#94a3b8"; // Slate
      default: return "#3b82f6"; // Blue
    }
  };

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (node.x === undefined || node.y === undefined) return;

    const label = String(node.name || node.id || "Unknown");
    const isLiteral = node.group === 'Literal';
    const fontSize = isLiteral ? 8 / globalScale : 14 / globalScale;
    const isHovered = hoverNode === node;
    const isDimmed = hoverNode && hoverNode !== node && !data.links.some((l: any) => 
      (l.source.id === node.id && l.target.id === hoverNode.id) || 
      (l.target.id === node.id && l.source.id === hoverNode.id)
    );

    // Make main entities much larger to stand out from the noise of literals
    const radius = isLiteral ? 3 : (node.group === 'student' ? 20 : 14);
    const color = getNodeColor(node.group);

    ctx.globalAlpha = isDimmed ? 0.1 : 1;

    // Draw shadow/glow if hovered or if it's a main entity
    if (isHovered || (!isLiteral && !isDimmed)) {
      ctx.shadowColor = color;
      ctx.shadowBlur = isHovered ? 20 : 8;
    } else {
      ctx.shadowBlur = 0;
    }

    // Draw Circle Node
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Add white stroke to main entities
    if (!isLiteral) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    ctx.shadowBlur = 0; // reset

    // Text Label: Always show for main entities, show for literals only on zoom/hover
    const shouldShowLabel = !isLiteral || globalScale > 2 || isHovered;
    
    if (shouldShowLabel && !isDimmed) {
      ctx.font = `600 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw background pill for text for better readability
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.6); 
      
      ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.roundRect(
        node.x - bckgDimensions[0] / 2, 
        node.y + radius + 4, 
        bckgDimensions[0], 
        bckgDimensions[1],
        4
      );
      ctx.fill();
      
      ctx.fillStyle = isHovered ? '#0f172a' : (isLiteral ? '#64748b' : '#1e293b');
      ctx.fillText(label, node.x, node.y + radius + 4 + bckgDimensions[1]/2);
    }
    
    ctx.globalAlpha = 1;
  }, [hoverNode, data]);

  return (
    <div className="w-full h-[650px] bg-white/50 backdrop-blur-xl rounded-xl overflow-hidden border border-white/20 shadow-2xl relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="font-semibold text-slate-800 text-lg">Semantic Knowledge Graph</h3>
        <p className="text-slate-500 text-sm">{data?.nodes?.length || 0} Nodes • {data?.links?.length || 0} Edges</p>
      </div>
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeCanvasObject={paintNode}
        onNodeHover={setHoverNode}
        nodeRelSize={6}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkLabel="label"
        linkColor={(link: any) => {
          if (!hoverNode) return "rgba(148, 163, 184, 0.3)";
          const isConnected = link.source.id === hoverNode.id || link.target.id === hoverNode.id;
          return isConnected ? "rgba(99, 102, 241, 0.8)" : "rgba(148, 163, 184, 0.05)";
        }}
        linkWidth={(link: any) => (hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id)) ? 2 : 1}
        linkDirectionalParticles={(link: any) => (hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id)) ? 3 : 0}
        linkDirectionalParticleSpeed={0.005}
        d3VelocityDecay={0.2}
      />
    </div>
  );
}
