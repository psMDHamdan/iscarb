/**
 * RDF Graph Types
 * Represents knowledge graph entities and relationships
 */

export interface RdfNode {
  id: string;
  uri: string;
  label: string;
  labelAr?: string;
  type: 'class' | 'instance' | 'property' | 'literal';
  description?: string;
  descriptionAr?: string;
  icon?: string;
  color?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface RdfEdge {
  id: string;
  source: string;
  target: string;
  predicate: string;
  predicateLabel?: string;
  predicateLabelAr?: string;
  weight?: number;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface RdfTriple {
  subject: RdfNode;
  predicate: string;
  object: RdfNode | string;
  confidence?: number;
  source?: string;
  timestamp?: number;
}

export interface RdfGraph {
  nodes: RdfNode[];
  edges: RdfEdge[];
  metadata?: {
    title?: string;
    description?: string;
    createdAt?: number;
    updatedAt?: number;
    version?: string;
  };
}

export type GraphViewMode = 'force-directed' | 'tree' | 'timeline' | 'table' | 'split';

export interface GraphViewState {
  mode: GraphViewMode;
  selectedNodeId?: string;
  hoveredNodeId?: string;
  searchQuery: string;
  filters: {
    nodeTypes?: string[];
    categories?: string[];
    minWeight?: number;
  };
  zoom: number;
  pan: { x: number; y: number };
}

export interface NodeInteraction {
  type: 'click' | 'double-click' | 'right-click' | 'hover' | 'drag';
  nodeId: string;
  position?: { x: number; y: number };
  timestamp: number;
}

export interface GraphExportOptions {
  format: 'png' | 'svg' | 'json-ld' | 'turtle' | 'json';
  filename: string;
  includeMetadata?: boolean;
  resolution?: number; // for PNG/SVG
}
