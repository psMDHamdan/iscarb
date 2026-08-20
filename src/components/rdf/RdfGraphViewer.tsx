'use client';

import React, { useState, useEffect } from 'react';
import { rdfGraphService } from '@/services/rdf-graph.service';
import { useI18n } from '@/hooks/useI18n';
import { AppButton, ErrorBoundary, LoadingSkeleton } from '@/components/ui';
import type { RdfGraph, RdfNode, GraphViewMode, GraphViewState } from '@/types/rdf';
import { cn } from '@/utils/cn';
import { RdfGraphVisualization } from './RdfGraphVisualization';
import { RdfNodeDetails } from './RdfNodeDetails';

interface RdfGraphViewerProps {
  initialQuery?: string;
  defaultMode?: GraphViewMode;
  onNodeSelect?: (node: RdfNode) => void;
  allowExport?: boolean;
  allowAiExplain?: boolean;
}

export function RdfGraphViewer({
  initialQuery,
  defaultMode = 'force-directed',
  onNodeSelect,
  allowExport = true,
  allowAiExplain = true,
}: RdfGraphViewerProps) {
  const { t, isRTL } = useI18n();

  const [graph, setGraph] = useState<RdfGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<GraphViewState>({
    mode: defaultMode,
    searchQuery: '',
    filters: {},
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
  const [selectedNode, setSelectedNode] = useState<RdfNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  useEffect(() => {
    const loadGraph = async () => {
      try {
        setIsLoading(true);
        const data = await rdfGraphService.fetchGraph(initialQuery);
        setGraph(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph');
        setGraph(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadGraph();
  }, [initialQuery]);

  const handleNodeClick = (node: RdfNode) => {
    setSelectedNode(node);
    onNodeSelect?.(node);
  };

  const handleExport = async (format: string) => {
    if (!graph) return;
    try {
      const blob = await rdfGraphService.exportGraph(graph, {
        format: format as any,
        filename: `graph-export-${Date.now()}`,
        includeMetadata: true,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `graph.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const filteredGraph = graph
    ? rdfGraphService.filterNodes(graph, viewState.filters.nodeTypes, viewState.filters.categories)
    : null;

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full gap-4 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">{t('rdf.graphViewer')}</h2>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 border rounded-lg p-1 bg-gray-100">
              {(['force-directed', 'tree', 'timeline', 'table', 'split'] as GraphViewMode[]).map(
                (mode) => (
                  <AppButton
                    key={mode}
                    label={t(`rdf.mode.${mode}`)}
                    action="custom"
                    size="sm"
                    variant={viewState.mode === mode ? 'primary' : 'ghost'}
                    onClick={() => setViewState((s) => ({ ...s, mode }))}
                  />
                ),
              )}
            </div>

            {allowExport && (
              <div className="flex gap-1">
                <AppButton
                  label="JSON"
                  action="custom"
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('json')}
                />
                <AppButton
                  label="JSON-LD"
                  action="custom"
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('json-ld')}
                />
                <AppButton
                  label="SVG"
                  action="custom"
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('svg')}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
          <div className="col-span-2 border rounded-lg bg-white overflow-hidden">
            {isLoading ? (
              <div className="p-4">
                <LoadingSkeleton type="card" count={3} />
              </div>
            ) : error ? (
              <div className="p-4 text-red-600">{error}</div>
            ) : (
              <RdfGraphVisualization
                mode={viewState.mode}
                graph={filteredGraph || graph}
                selectedNodeId={selectedNode?.id}
                hoveredNodeId={hoveredNodeId}
                onNodeClick={handleNodeClick}
                onNodeHover={setHoveredNodeId}
              />
            )}
          </div>

          <div className="border rounded-lg bg-white overflow-y-auto">
            {selectedNode ? (
              <RdfNodeDetails
                node={selectedNode}
                graph={graph}
                allowAiExplain={allowAiExplain}
              />
            ) : (
              <div className="p-4 text-gray-500 text-center">
                <p>{t('rdf.selectNode')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('rdf.searchNodes')}
            value={viewState.searchQuery}
            onChange={(e) =>
              setViewState((s) => ({
                ...s,
                searchQuery: e.target.value,
              }))
            }
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E6C3C]"
          />
          <AppButton
            label={t('rdf.nodes')}
            action="custom"
            size="sm"
            variant="outline"
            disabled
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default RdfGraphViewer;
