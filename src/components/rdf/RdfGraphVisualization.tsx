'use client';

import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import type { RdfGraph, RdfNode, GraphViewMode } from '@/types/rdf';
import { cn } from '@/utils/cn';

interface RdfGraphVisualizationProps {
  mode: GraphViewMode;
  graph: RdfGraph | null;
  selectedNodeId?: string;
  hoveredNodeId?: string;
  onNodeClick: (node: RdfNode) => void;
  onNodeHover: (nodeId: string | null) => void;
}

export function RdfGraphVisualization({
  mode,
  graph,
  selectedNodeId,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
}: RdfGraphVisualizationProps) {
  const { t } = useI18n();

  if (!graph || graph.nodes.length === 0) {
    return <div className="p-4 text-gray-500">{t('rdf.noData')}</div>;
  }

  switch (mode) {
    case 'force-directed':
      return (
        <ForceDirectedGraph
          graph={graph}
          selectedNodeId={selectedNodeId}
          hoveredNodeId={hoveredNodeId}
          onNodeClick={onNodeClick}
          onNodeHover={onNodeHover}
        />
      );
    case 'tree':
      return <TreeGraph graph={graph} selectedNodeId={selectedNodeId} onNodeClick={onNodeClick} />;
    case 'table':
      return <TableView graph={graph} selectedNodeId={selectedNodeId} onNodeClick={onNodeClick} />;
    case 'timeline':
      return <TimelineView graph={graph} />;
    case 'split':
      return (
        <SplitView
          graph={graph}
          selectedNodeId={selectedNodeId}
          onNodeClick={onNodeClick}
        />
      );
    default:
      return null;
  }
}

function ForceDirectedGraph({
  graph,
  selectedNodeId,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
}: {
  graph: RdfGraph;
  selectedNodeId?: string;
  hoveredNodeId?: string;
  onNodeClick: (node: RdfNode) => void;
  onNodeHover: (nodeId: string | null) => void;
}) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <p className="text-lg font-semibold mb-2">Force-Directed Graph</p>
        <p className="text-sm text-gray-600 mb-4">
          {graph.nodes.length} nodes, {graph.edges.length} edges
        </p>
        <div className="grid grid-cols-2 gap-2 max-w-md">
          {graph.nodes.slice(0, 4).map((node) => (
            <div
              key={node.id}
              onClick={() => onNodeClick(node)}
              onMouseEnter={() => onNodeHover(node.id)}
              onMouseLeave={() => onNodeHover(null)}
              className={cn(
                'p-3 rounded-lg cursor-pointer transition text-sm',
                selectedNodeId === node.id
                  ? 'bg-[#0E6C3C] text-white'
                  : hoveredNodeId === node.id
                    ? 'bg-gray-200'
                    : 'bg-white border border-gray-300',
              )}
            >
              <span className="mr-2">{node.icon}</span>
              {node.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TreeGraph({
  graph,
  selectedNodeId,
  onNodeClick,
}: {
  graph: RdfGraph;
  selectedNodeId?: string;
  onNodeClick: (node: RdfNode) => void;
}) {
  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="space-y-2">
        {graph.nodes.map((node) => (
          <div
            key={node.id}
            onClick={() => onNodeClick(node)}
            className={cn(
              'p-3 rounded-lg cursor-pointer transition text-sm',
              selectedNodeId === node.id
                ? 'bg-[#0E6C3C] text-white'
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200',
            )}
          >
            <span className="mr-2">{node.icon}</span>
            {node.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableView({
  graph,
  selectedNodeId,
  onNodeClick,
}: {
  graph: RdfGraph;
  selectedNodeId?: string;
  onNodeClick: (node: RdfNode) => void;
}) {
  return (
    <div className="p-4 overflow-x-auto h-full">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b sticky top-0 bg-gray-50">
            <th className="px-3 py-2 text-left font-semibold text-xs">Type</th>
            <th className="px-3 py-2 text-left font-semibold text-xs">Label</th>
            <th className="px-3 py-2 text-left font-semibold text-xs">Category</th>
          </tr>
        </thead>
        <tbody>
          {graph.nodes.map((node) => (
            <tr
              key={node.id}
              onClick={() => onNodeClick(node)}
              className={cn(
                'border-b cursor-pointer hover:bg-gray-100 transition',
                selectedNodeId === node.id && 'bg-[#0E6C3C] text-white',
              )}
            >
              <td className="px-3 py-2 text-xs">{node.type}</td>
              <td className="px-3 py-2">{node.label}</td>
              <td className="px-3 py-2 text-xs">{node.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineView({ graph }: { graph: RdfGraph }) {
  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="space-y-3">
        {graph.nodes.slice(0, 5).map((node) => (
          <div key={node.id} className="flex gap-3">
            <div className="w-24 text-xs text-gray-600 flex-shrink-0">
              {new Date(node.metadata?.timestamp || Date.now()).toLocaleDateString()}
            </div>
            <div className="flex-1 p-2 rounded border border-gray-300 text-sm bg-white hover:bg-gray-50">
              {node.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SplitView({
  graph,
  selectedNodeId,
  onNodeClick,
}: {
  graph: RdfGraph;
  selectedNodeId?: string;
  onNodeClick: (node: RdfNode) => void;
}) {
  return (
    <div className="grid grid-cols-2 h-full divide-x">
      <div className="overflow-y-auto p-4">
        <p className="text-sm font-semibold mb-3">Nodes ({graph.nodes.length})</p>
        <div className="space-y-2">
          {graph.nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => onNodeClick(node)}
              className={cn(
                'p-2 rounded text-sm cursor-pointer transition',
                selectedNodeId === node.id
                  ? 'bg-[#0E6C3C] text-white'
                  : 'hover:bg-gray-100 bg-white border border-gray-200',
              )}
            >
              {node.label}
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-y-auto p-4">
        <p className="text-sm font-semibold mb-3">Relationships ({graph.edges.length})</p>
        <div className="space-y-2">
          {graph.edges.map((edge) => (
            <div
              key={edge.id}
              className="p-2 rounded text-sm bg-gray-50 border border-gray-200"
            >
              <span className="font-medium text-[#0E6C3C]">
                {edge.predicateLabel || edge.predicate}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RdfGraphVisualization;
