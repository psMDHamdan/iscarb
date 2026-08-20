/**
 * Monitoring Builder — generates health checks, metrics, alerts, and
 * dashboard configurations from the iSCARB ontology.
 */
import type { OntologyEngine } from './engine';

// ── Types ───────────────────────────────────────────────────────────────────

export interface HealthCheck {
  name: string;
  endpoint: string;
  interval: string;
  timeout: string;
  description: string;
  checkType: 'http' | 'tcp' | 'database' | 'custom';
}

export interface MetricDefinition {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels: string[];
  namespace: string;
  buckets?: number[];
}

export interface AlertRule {
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  runbookUrl?: string;
}

export interface DashboardPanel {
  title: string;
  type: 'graph' | 'stat' | 'table' | 'heatmap' | 'row';
  metrics: string[];
  gridPos: { h: number; w: number; x: number; y: number };
}

export interface DashboardConfig {
  title: string;
  description: string;
  refreshInterval: string;
  timeRange: { from: string; to: string };
  panels: DashboardPanel[];
  templating: { name: string; query: string; type: string }[];
}

// ── MonitoringBuilder ───────────────────────────────────────────────────────

export class MonitoringBuilder {
  private toSnake(s: string): string {
    return s.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  private toKebab(s: string): string {
    return s.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  }

  // ── Health Checks ─────────────────────────────────────────────────────────

  generateHealthChecks(ontology: OntologyEngine): HealthCheck[] {
    const checks: HealthCheck[] = [
      {
        name: 'api-health',
        endpoint: '/api/v1/ontology',
        interval: '30s',
        timeout: '5s',
        description: 'Main ontology API endpoint health check',
        checkType: 'http',
      },
      {
        name: 'database-health',
        endpoint: '/api/v1/ontology/validate',
        interval: '60s',
        timeout: '10s',
        description: 'PostgreSQL database connectivity check',
        checkType: 'database',
      },
      {
        name: 'schema-health',
        endpoint: '/api/v1/ontology/schema',
        interval: '300s',
        timeout: '10s',
        description: 'Schema generation and consistency check',
        checkType: 'http',
      },
      {
        name: 'triple-store-health',
        endpoint: '/api/v1/triple-store/stats',
        interval: '60s',
        timeout: '5s',
        description: 'RDF triple store memory health',
        checkType: 'http',
      },
    ];

    // Add per-entity health checks for major entities
    for (const [id, cls] of ontology.classes) {
      const hasProperties = Array.from(ontology.datatypeProperties.values()).some(p => p.domain === id);
      if (hasProperties) {
        checks.push({
          name: `${this.toKebab(id)}-health`,
          endpoint: `/api/v1/ontology/classes/${id}`,
          interval: '120s',
          timeout: '5s',
          description: `${cls.label} entity data integrity check`,
          checkType: 'http',
        });
      }
    }

    return checks;
  }

  // ── Metrics ───────────────────────────────────────────────────────────────

  generateMetrics(ontology: OntologyEngine): MetricDefinition[] {
    const metrics: MetricDefinition[] = [
      // API metrics
      {
        name: 'iscarb_api_request_duration_seconds',
        help: 'Duration of API requests in seconds',
        type: 'histogram',
        labels: ['method', 'path', 'status'],
        namespace: 'iscarb',
        buckets: [0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
      },
      {
        name: 'iscarb_api_requests_total',
        help: 'Total number of API requests',
        type: 'counter',
        labels: ['method', 'path', 'status'],
        namespace: 'iscarb',
      },
      {
        name: 'iscarb_api_errors_total',
        help: 'Total number of API errors by type',
        type: 'counter',
        labels: ['method', 'path', 'error_type'],
        namespace: 'iscarb',
      },

      // Triple store metrics
      {
        name: 'iscarb_triple_store_size',
        help: 'Current number of triples in the store',
        type: 'gauge',
        labels: ['graph'],
        namespace: 'iscarb',
      },
      {
        name: 'iscarb_triple_store_inserts_total',
        help: 'Total triples inserted',
        type: 'counter',
        labels: ['graph'],
        namespace: 'iscarb',
      },

      // Vector index metrics
      {
        name: 'iscarb_vector_index_size',
        help: 'Number of vectors in the index',
        type: 'gauge',
        labels: ['collection'],
        namespace: 'iscarb',
      },
      {
        name: 'iscarb_vector_index_query_duration_seconds',
        help: 'Duration of vector similarity queries',
        type: 'histogram',
        labels: ['collection'],
        namespace: 'iscarb',
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
      },

      // AI query metrics
      {
        name: 'iscarb_ai_query_duration_seconds',
        help: 'Duration of AI-powered queries',
        type: 'histogram',
        labels: ['query_type'],
        namespace: 'iscarb',
        buckets: [0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
      },
      {
        name: 'iscarb_ai_query_tokens_total',
        help: 'Total tokens consumed by AI queries',
        type: 'counter',
        labels: ['model', 'query_type'],
        namespace: 'iscarb',
      },
      {
        name: 'iscarb_ai_query_errors_total',
        help: 'Total AI query failures',
        type: 'counter',
        labels: ['query_type', 'error_type'],
        namespace: 'iscarb',
      },

      // User activity metrics
      {
        name: 'iscarb_user_active_sessions',
        help: 'Number of active user sessions',
        type: 'gauge',
        labels: ['role'],
        namespace: 'iscarb',
      },
      {
        name: 'iscarb_user_actions_total',
        help: 'Total user actions performed',
        type: 'counter',
        labels: ['action_type', 'entity_type'],
        namespace: 'iscarb',
      },

      // Ontology metrics
      {
        name: 'iscarb_ontology_classes_total',
        help: 'Total number of ontology classes',
        type: 'gauge',
        labels: [],
        namespace: 'iscarb',
      },
      {
        name: 'iscarb_ontology_properties_total',
        help: 'Total number of ontology properties',
        type: 'gauge',
        labels: ['type'],
        namespace: 'iscarb',
      },
      {
        name: 'iscarb_ontology_individuals_total',
        help: 'Total number of ontology individuals',
        type: 'gauge',
        labels: ['class_type'],
        namespace: 'iscarb',
      },

      // Database metrics
      {
        name: 'iscarb_db_connections_active',
        help: 'Active database connections',
        type: 'gauge',
        labels: ['pool'],
        namespace: 'iscarb',
      },
      {
        name: 'iscarb_db_query_duration_seconds',
        help: 'Duration of database queries',
        type: 'histogram',
        labels: ['operation', 'model'],
        namespace: 'iscarb',
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0],
      },
    ];

    return metrics;
  }

  // ── Alert Rules ───────────────────────────────────────────────────────────

  generateAlerts(ontology: OntologyEngine): AlertRule[] {
    return [
      {
        name: 'HighAPIErrorRate',
        metric: 'rate(iscarb_api_errors_total[5m])',
        condition: '>',
        threshold: 0.05,
        duration: '5m',
        severity: 'critical',
        description: 'API error rate exceeds 5% for 5 minutes',
        runbookUrl: '/docs/runbooks/api-errors',
      },
      {
        name: 'HighAPILatency',
        metric: 'histogram_quantile(0.95, rate(iscarb_api_request_duration_seconds_bucket[5m]))',
        condition: '>',
        threshold: 2.0,
        duration: '5m',
        severity: 'warning',
        description: '95th percentile API latency exceeds 2 seconds',
        runbookUrl: '/docs/runbooks/api-latency',
      },
      {
        name: 'TripleStoreSizeWarning',
        metric: 'iscarb_triple_store_size',
        condition: '>',
        threshold: 1000000,
        duration: '10m',
        severity: 'warning',
        description: 'Triple store exceeds 1M entries',
      },
      {
        name: 'TripleStoreSizeCritical',
        metric: 'iscarb_triple_store_size',
        condition: '>',
        threshold: 5000000,
        duration: '5m',
        severity: 'critical',
        description: 'Triple store exceeds 5M entries — risk of OOM',
      },
      {
        name: 'VectorIndexSizeWarning',
        metric: 'iscarb_vector_index_size',
        condition: '>',
        threshold: 100000,
        duration: '10m',
        severity: 'warning',
        description: 'Vector index exceeds 100K vectors',
      },
      {
        name: 'HighAILatency',
        metric: 'histogram_quantile(0.95, rate(iscarb_ai_query_duration_seconds_bucket[5m]))',
        condition: '>',
        threshold: 10.0,
        duration: '5m',
        severity: 'warning',
        description: '95th percentile AI query latency exceeds 10 seconds',
      },
      {
        name: 'AIQueryErrors',
        metric: 'rate(iscarb_ai_query_errors_total[5m])',
        condition: '>',
        threshold: 0.1,
        duration: '5m',
        severity: 'critical',
        description: 'AI query error rate exceeds 10%',
        runbookUrl: '/docs/runbooks/ai-errors',
      },
      {
        name: 'HighActiveSessions',
        metric: 'iscarb_user_active_sessions',
        condition: '>',
        threshold: 500,
        duration: '15m',
        severity: 'info',
        description: 'Active sessions exceed 500',
      },
      {
        name: 'DatabaseConnectionPoolExhausted',
        metric: 'iscarb_db_connections_active',
        condition: '>',
        threshold: 80,
        duration: '5m',
        severity: 'critical',
        description: 'Database connection pool nearly exhausted (>80 active)',
        runbookUrl: '/docs/runbooks/db-connections',
      },
      {
        name: 'HighDBLatency',
        metric: 'histogram_quantile(0.95, rate(iscarb_db_query_duration_seconds_bucket[5m]))',
        condition: '>',
        threshold: 0.5,
        duration: '5m',
        severity: 'warning',
        description: '95th percentile DB query latency exceeds 500ms',
      },
    ];
  }

  // ── Dashboard Configuration ───────────────────────────────────────────────

  generateDashboard(ontology: OntologyEngine): DashboardConfig {
    const panels: DashboardPanel[] = [
      // Row 1: Overview
      {
        title: 'API Request Rate',
        type: 'graph',
        metrics: ['iscarb_api_requests_total'],
        gridPos: { h: 8, w: 12, x: 0, y: 0 },
      },
      {
        title: 'API Error Rate',
        type: 'graph',
        metrics: ['iscarb_api_errors_total'],
        gridPos: { h: 8, w: 12, x: 12, y: 0 },
      },
      // Row 2: Latency
      {
        title: 'API Latency (p95)',
        type: 'graph',
        metrics: ['iscarb_api_request_duration_seconds'],
        gridPos: { h: 8, w: 12, x: 0, y: 8 },
      },
      {
        title: 'AI Query Latency (p95)',
        type: 'graph',
        metrics: ['iscarb_ai_query_duration_seconds'],
        gridPos: { h: 8, w: 12, x: 12, y: 8 },
      },
      // Row 3: Storage
      {
        title: 'Triple Store Size',
        type: 'stat',
        metrics: ['iscarb_triple_store_size'],
        gridPos: { h: 6, w: 8, x: 0, y: 16 },
      },
      {
        title: 'Vector Index Size',
        type: 'stat',
        metrics: ['iscarb_vector_index_size'],
        gridPos: { h: 6, w: 8, x: 8, y: 16 },
      },
      {
        title: 'Active Sessions',
        type: 'stat',
        metrics: ['iscarb_user_active_sessions'],
        gridPos: { h: 6, w: 8, x: 16, y: 16 },
      },
      // Row 4: Database
      {
        title: 'DB Query Latency',
        type: 'graph',
        metrics: ['iscarb_db_query_duration_seconds'],
        gridPos: { h: 8, w: 12, x: 0, y: 22 },
      },
      {
        title: 'DB Connections',
        type: 'graph',
        metrics: ['iscarb_db_connections_active'],
        gridPos: { h: 8, w: 12, x: 12, y: 22 },
      },
      // Row 5: Ontology stats
      {
        title: 'Ontology Classes',
        type: 'stat',
        metrics: ['iscarb_ontology_classes_total'],
        gridPos: { h: 6, w: 6, x: 0, y: 30 },
      },
      {
        title: 'Ontology Properties',
        type: 'stat',
        metrics: ['iscarb_ontology_properties_total'],
        gridPos: { h: 6, w: 6, x: 6, y: 30 },
      },
      {
        title: 'Ontology Individuals',
        type: 'stat',
        metrics: ['iscarb_ontology_individuals_total'],
        gridPos: { h: 6, w: 6, x: 12, y: 30 },
      },
      {
        title: 'User Activity',
        type: 'heatmap',
        metrics: ['iscarb_user_actions_total'],
        gridPos: { h: 6, w: 6, x: 18, y: 30 },
      },
    ];

    return {
      title: 'iSCARB Platform Monitoring',
      description: 'Comprehensive monitoring dashboard for the iSCARB academic platform',
      refreshInterval: '30s',
      timeRange: { from: 'now-1h', to: 'now' },
      panels,
      templating: [
        {
          name: 'instance',
          query: 'label_values(iscarb_api_requests_total, instance)',
          type: 'query',
        },
        {
          name: 'role',
          query: 'label_values(iscarb_user_active_sessions, role)',
          type: 'query',
        },
      ],
    };
  }
}
