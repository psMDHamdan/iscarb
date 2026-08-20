'use client';

import React from 'react';
import { rdfGraphService } from '@/services/rdf-graph.service';
import { useI18n } from '@/hooks/useI18n';
import type { RdfGraph, RdfNode } from '@/types/rdf';

interface RdfNodeDetailsProps {
  node: RdfNode;
  graph: RdfGraph | null;
  allowAiExplain?: boolean;
}

export function RdfNodeDetails({ node, graph }: RdfNodeDetailsProps) {
  const { t } = useI18n();

  if (!graph) {
    return null;
  }

  const related = rdfGraphService.getRelatedNodes(graph, node.id, 1);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-start gap-2">
          <span className="text-3xl">{node.icon}</span>
          <div>
            <h3 className="text-xl font-bold">{node.label}</h3>
            <p className="text-xs text-gray-600 break-all">{node.uri}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {node.description && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-1">{t('rdf.description')}</h4>
          <p className="text-sm text-gray-600">{node.description}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-2 bg-gray-50 rounded">
          <span className="font-semibold text-xs text-gray-700">{t('rdf.type')}</span>
          <p className="text-gray-600">{node.type}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <span className="font-semibold text-xs text-gray-700">{t('rdf.category')}</span>
          <p className="text-gray-600">{node.category || 'N/A'}</p>
        </div>
      </div>

      {/* Related Nodes */}
      {related.nodes.length > 1 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-2">
            {t('rdf.relatedNodes')} ({related.nodes.length - 1})
          </h4>
          <div className="space-y-1">
            {related.nodes
              .filter((n) => n.id !== node.id)
              .slice(0, 5)
              .map((n) => (
                <div key={n.id} className="text-xs p-2 bg-gray-50 rounded">
                  <span>{n.icon}</span> {n.label}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RdfNodeDetails;
