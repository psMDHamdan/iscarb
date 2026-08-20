/**
 * Analytics Builder — generates entity analytics, dashboards, KPIs,
 * reports, and chart configurations from the iSCARB ontology.
 */
import type { OntologyEngine } from './engine';

// ── Types ───────────────────────────────────────────────────────────────────

export interface EntityAnalytics {
  className: string;
  count: number;
  growthRate: number;
  activityRate: number;
  healthScore: number;
  topProperties: { name: string; usageRate: number }[];
  relationships: { name: string; count: number }[];
}

export interface AnalyticsConfig {
  entities: EntityAnalytics[];
  summary: {
    totalEntities: number;
    avgHealthScore: number;
    avgGrowthRate: number;
    avgActivityRate: number;
  };
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'kpi' | 'chart' | 'table' | 'list';
  entityType?: string;
  metric: string;
  size: 'sm' | 'md' | 'lg';
  refreshInterval: string;
}

export interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  entityType: string;
  metric: string;
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'rate';
  timeRange: string;
  threshold?: { warning: number; critical: number };
  unit?: string;
}

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'summary' | 'detailed' | 'trend' | 'comparison';
  entityTypes: string[];
  metrics: string[];
  schedule?: string;
  format: 'markdown' | 'pdf' | 'csv' | 'json';
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'heatmap' | 'scatter';
  entityType: string;
  xAxis?: string;
  yAxis?: string;
  metric: string;
  aggregation: 'count' | 'sum' | 'avg' | 'group_by';
  groupBy?: string;
  colors?: string[];
  options?: Record<string, unknown>;
}

// ── AnalyticsBuilder ────────────────────────────────────────────────────────

export class AnalyticsBuilder {
  private toSnake(s: string): string {
    return s.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  // ── Entity Analytics ──────────────────────────────────────────────────────

  generateEntityAnalytics(ontology: OntologyEngine): AnalyticsConfig {
    const entities: EntityAnalytics[] = [];

    for (const [id, cls] of ontology.classes) {
      const dtProps = Array.from(ontology.datatypeProperties.values()).filter(p => p.domain === id);
      const objProps = Array.from(ontology.objectProperties.values()).filter(p => p.domain === id || p.range === id);
      const individuals = Array.from(ontology.individuals.values()).filter(i => i.classType === id);

      // Calculate property usage rate
      const totalPossibleProperties = dtProps.length;
      const usedProperties = dtProps.filter(p => {
        return individuals.some(ind => ind.properties[p.name] !== undefined);
      }).length;

      const topProperties = dtProps.map(p => ({
        name: p.name,
        usageRate: individuals.length > 0
          ? usedProperties / totalPossibleProperties * 100
          : 0,
      }));

      const relationships = objProps.map((p, idx) => ({
        name: p.name,
        count: Math.min(100, individuals.length * (idx + 1)),
      }));

      // Health score based on completeness
      const propertyCoverage = totalPossibleProperties > 0
        ? (usedProperties / totalPossibleProperties) * 100
        : 0;
      const relationshipScore = Math.min(objProps.length * 10, 100);
      const individualScore = Math.min(individuals.length * 5, 100);
      const healthScore = Math.round((propertyCoverage + relationshipScore + individualScore) / 3);

      // Growth rate (simulated — would be calculated from historical data)
      const growthRate = individuals.length > 0 ? Math.round(individuals.length / 10 - 5) : 0;

      // Activity rate based on property density
      const activityRate = Math.round(
        (dtProps.length + objProps.length) / Math.max(ontology.classes.size, 1) * 10
      );

      entities.push({
        className: cls.label,
        count: individuals.length,
        growthRate,
        activityRate: Math.min(activityRate, 100),
        healthScore: Math.min(healthScore, 100),
        topProperties,
        relationships,
      });
    }

    const summary = {
      totalEntities: entities.length,
      avgHealthScore: entities.length > 0
        ? Math.round(entities.reduce((s, e) => s + e.healthScore, 0) / entities.length)
        : 0,
      avgGrowthRate: entities.length > 0
        ? Math.round(entities.reduce((s, e) => s + e.growthRate, 0) / entities.length)
        : 0,
      avgActivityRate: entities.length > 0
        ? Math.round(entities.reduce((s, e) => s + e.activityRate, 0) / entities.length)
        : 0,
    };

    return { entities, summary };
  }

  // ── Dashboard Widgets ─────────────────────────────────────────────────────

  generateDashboards(ontology: OntologyEngine): DashboardWidget[] {
    const widgets: DashboardWidget[] = [];

    // Overview KPIs
    widgets.push({
      id: 'total-classes',
      title: 'Total Classes',
      type: 'kpi',
      metric: 'count',
      size: 'sm',
      refreshInterval: '5m',
    });

    widgets.push({
      id: 'total-properties',
      title: 'Total Properties',
      type: 'kpi',
      metric: 'count',
      size: 'sm',
      refreshInterval: '5m',
    });

    widgets.push({
      id: 'total-individuals',
      title: 'Total Individuals',
      type: 'kpi',
      metric: 'count',
      size: 'sm',
      refreshInterval: '5m',
    });

    widgets.push({
      id: 'avg-health',
      title: 'Avg Health Score',
      type: 'kpi',
      metric: 'health_score',
      size: 'sm',
      refreshInterval: '5m',
    });

    // Per-entity widgets for major entities
    const majorEntities = ['Student', 'FacultyMember', 'Course', 'Enrollment', 'Grade', 'ResearchProject'];
    for (const entityId of majorEntities) {
      const cls = ontology.classes.get(entityId);
      if (!cls) continue;

      widgets.push({
        id: `${this.toSnake(entityId)}-count`,
        title: `${cls.label} Count`,
        type: 'kpi',
        entityType: entityId,
        metric: 'count',
        size: 'sm',
        refreshInterval: '5m',
      });

      widgets.push({
        id: `${this.toSnake(entityId)}-growth`,
        title: `${cls.label} Growth`,
        type: 'chart',
        entityType: entityId,
        metric: 'growth_rate',
        size: 'md',
        refreshInterval: '1h',
      });

      widgets.push({
        id: `${this.toSnake(entityId)}-activity`,
        title: `${cls.label} Activity`,
        type: 'chart',
        entityType: entityId,
        metric: 'activity_rate',
        size: 'md',
        refreshInterval: '1h',
      });
    }

    // System-wide charts
    widgets.push({
      id: 'class-distribution',
      title: 'Class Distribution',
      type: 'chart',
      metric: 'individual_count',
      size: 'lg',
      refreshInterval: '5m',
    });

    widgets.push({
      id: 'property-density',
      title: 'Property Density per Class',
      type: 'chart',
      metric: 'property_density',
      size: 'lg',
      refreshInterval: '1h',
    });

    widgets.push({
      id: 'relationship-map',
      title: 'Relationship Overview',
      type: 'chart',
      metric: 'relationship_count',
      size: 'lg',
      refreshInterval: '5m',
    });

    return widgets;
  }

  // ── KPI Definitions ───────────────────────────────────────────────────────

  generateKpis(ontology: OntologyEngine): KpiDefinition[] {
    const kpis: KpiDefinition[] = [
      // System KPIs
      {
        id: 'ontology-completeness',
        name: 'Ontology Completeness',
        description: 'Percentage of classes with defined properties and relationships',
        entityType: 'Ontology',
        metric: 'completeness_score',
        aggregation: 'avg',
        timeRange: '24h',
        threshold: { warning: 80, critical: 60 },
        unit: '%',
      },
      {
        id: 'data-quality',
        name: 'Data Quality Score',
        description: 'Average data completeness across all entities',
        entityType: 'Global',
        metric: 'data_quality',
        aggregation: 'avg',
        timeRange: '24h',
        threshold: { warning: 85, critical: 70 },
        unit: '%',
      },
    ];

    // Per-entity KPIs
    for (const [id, cls] of ontology.classes) {
      const dtProps = Array.from(ontology.datatypeProperties.values()).filter(p => p.domain === id);
      if (dtProps.length === 0) continue;

      kpis.push({
        id: `${this.toSnake(id)}-count`,
        name: `${cls.label} Count`,
        description: `Total number of ${cls.label} instances`,
        entityType: id,
        metric: 'count',
        aggregation: 'count',
        timeRange: '24h',
        threshold: { warning: 1000, critical: 5000 },
      });

      kpis.push({
        id: `${this.toSnake(id)}-growth-rate`,
        name: `${cls.label} Growth Rate`,
        description: `Daily growth rate of ${cls.label} instances`,
        entityType: id,
        metric: 'growth_rate',
        aggregation: 'rate',
        timeRange: '7d',
        threshold: { warning: 20, critical: 50 },
        unit: '%',
      });

      kpis.push({
        id: `${this.toSnake(id)}-activity-rate`,
        name: `${cls.label} Activity Rate`,
        description: `Activity rate of ${cls.label} instances`,
        entityType: id,
        metric: 'activity_rate',
        aggregation: 'rate',
        timeRange: '24h',
        threshold: { warning: 10, critical: 5 },
        unit: '%',
      });

      kpis.push({
        id: `${this.toSnake(id)}-health-score`,
        name: `${cls.label} Health Score`,
        description: `Data completeness and quality score for ${cls.label}`,
        entityType: id,
        metric: 'health_score',
        aggregation: 'avg',
        timeRange: '24h',
        threshold: { warning: 80, critical: 60 },
        unit: '%',
      });
    }

    return kpis;
  }

  // ── Report Templates ──────────────────────────────────────────────────────

  generateReports(ontology: OntologyEngine): ReportConfig[] {
    const entityTypes = Array.from(ontology.classes.keys());

    return [
      {
        id: 'ontology-summary',
        name: 'Ontology Summary Report',
        description: 'Overview of the entire ontology structure and health',
        type: 'summary',
        entityTypes,
        metrics: ['count', 'health_score', 'growth_rate'],
        schedule: 'weekly',
        format: 'markdown',
      },
      {
        id: 'entity-detail',
        name: 'Entity Detail Report',
        description: 'Detailed analytics for each entity type',
        type: 'detailed',
        entityTypes,
        metrics: ['count', 'health_score', 'activity_rate', 'growth_rate', 'property_coverage'],
        schedule: 'daily',
        format: 'markdown',
      },
      {
        id: 'trend-analysis',
        name: 'Trend Analysis Report',
        description: 'Historical trends for entity counts and metrics',
        type: 'trend',
        entityTypes: entityTypes.filter(id => {
          const individuals = Array.from(ontology.individuals.values()).filter(i => i.classType === id);
          return individuals.length > 0;
        }),
        metrics: ['count', 'growth_rate'],
        schedule: 'weekly',
        format: 'json',
      },
      {
        id: 'data-quality',
        name: 'Data Quality Report',
        description: 'Data completeness and quality assessment across all entities',
        type: 'summary',
        entityTypes,
        metrics: ['health_score', 'property_coverage', 'activity_rate'],
        schedule: 'weekly',
        format: 'markdown',
      },
      {
        id: 'relationship-analysis',
        name: 'Relationship Analysis Report',
        description: 'Analysis of entity relationships and connectivity',
        type: 'detailed',
        entityTypes,
        metrics: ['relationship_count', 'relationship_density'],
        schedule: 'monthly',
        format: 'markdown',
      },
    ];
  }

  // ── Chart Definitions ─────────────────────────────────────────────────────

  generateCharts(ontology: OntologyEngine): ChartConfig[] {
    const charts: ChartConfig[] = [];
    const entityIds = Array.from(ontology.classes.keys());

    // Global distribution chart
    charts.push({
      id: 'entity-distribution',
      title: 'Entity Distribution',
      type: 'bar',
      entityType: 'Global',
      xAxis: 'className',
      yAxis: 'count',
      metric: 'count',
      aggregation: 'group_by',
      groupBy: 'classType',
    });

    // Line chart for growth over time
    charts.push({
      id: 'growth-timeline',
      title: 'Entity Growth Over Time',
      type: 'line',
      entityType: 'Global',
      xAxis: 'date',
      yAxis: 'count',
      metric: 'count',
      aggregation: 'count',
    });

    // Pie chart for class hierarchy
    charts.push({
      id: 'class-hierarchy-pie',
      title: 'Class Hierarchy Distribution',
      type: 'pie',
      entityType: 'Global',
      metric: 'count',
      aggregation: 'group_by',
      groupBy: 'parentClass',
    });

    // Per-entity charts for major entities
    const majorEntities = ['Student', 'FacultyMember', 'Course', 'Enrollment', 'Grade'];
    for (const entityId of majorEntities) {
      const cls = ontology.classes.get(entityId);
      if (!cls) continue;
      const snake = this.toSnake(entityId);

      charts.push({
        id: `${snake}-count-bar`,
        title: `${cls.label} Count`,
        type: 'bar',
        entityType: entityId,
        metric: 'count',
        aggregation: 'count',
      });

      charts.push({
        id: `${snake}-trend-line`,
        title: `${cls.label} Trend`,
        type: 'line',
        entityType: entityId,
        xAxis: 'date',
        yAxis: 'count',
        metric: 'count',
        aggregation: 'count',
      });

      charts.push({
        id: `${snake}-health-scatter`,
        title: `${cls.label} Health vs Activity`,
        type: 'scatter',
        entityType: entityId,
        xAxis: 'activity_rate',
        yAxis: 'health_score',
        metric: 'health_score',
        aggregation: 'avg',
      });
    }

    // Property density heatmap
    charts.push({
      id: 'property-density-heatmap',
      title: 'Property Density Heatmap',
      type: 'heatmap',
      entityType: 'Global',
      xAxis: 'className',
      yAxis: 'propertyType',
      metric: 'property_density',
      aggregation: 'count',
    });

    return charts;
  }
}
