/**
 * Documentation Generator — produces Markdown, Mermaid, and HTML docs
 * from the iSCARB ontology engine.
 */
import type { OntologyEngine, OntologyClass, ObjectProperty, DatatypeProperty, ValidationResult } from './engine';
import {
  generateErDiagram,
  generateMermaidClassDiagram,
  generateMermaidFlowchart,
} from './er-diagram';
import { ontologyEngineToOntology } from './schema-generator';

// ── Types ───────────────────────────────────────────────────────────────────

export interface EntityDoc {
  className: string;
  description: string;
  properties: PropertyDoc[];
  relationships: RelationshipDoc[];
  examples: string[];
  apiEndpoints: string[];
  uiPages: string[];
}

export interface PropertyDoc {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  constraints?: string;
}

export interface RelationshipDoc {
  name: string;
  target: string;
  cardinality: string;
  description: string;
}

export interface ApiDoc {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters: ApiParamDoc[];
  requestBody?: string;
  responseExample: string;
}

export interface ApiParamDoc {
  name: string;
  in: string;
  required: boolean;
  type: string;
  description: string;
}

export interface FullVerificationReport {
  valid: boolean;
  coverageScore: number;
  driftScore: number;
  findings: string[];
  layers: Record<string, { passed: boolean; score: number }>;
}

// ── DocGenerator ────────────────────────────────────────────────────────────

export class DocGenerator {
  private pascalCase(s: string): string {
    return s.replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^(.)/, (_, c: string) => c.toUpperCase());
  }

  private toSnake(s: string): string {
    return s.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  // ── Entity Documentation ──────────────────────────────────────────────────

  generateEntityDocs(ontology: OntologyEngine, className: string): EntityDoc {
    const cls = ontology.classes.get(className);
    if (!cls) throw new Error(`Class '${className}' not found in ontology`);

    const properties: PropertyDoc[] = [];
    const relationships: RelationshipDoc[] = [];

    // Collect datatype properties
    for (const [, prop] of ontology.datatypeProperties) {
      if (prop.domain === className) {
        const constraints: string[] = [];
        if (prop.minLength) constraints.push(`min length: ${prop.minLength}`);
        if (prop.maxLength) constraints.push(`max length: ${prop.maxLength}`);
        if (prop.pattern) constraints.push(`pattern: ${prop.pattern}`);
        if (prop.unit) constraints.push(`unit: ${prop.unit}`);

        properties.push({
          name: prop.name,
          type: prop.datatype,
          required: prop.required,
          description: `${prop.name} of the ${cls.label}`,
          defaultValue: prop.defaultValue,
          constraints: constraints.length > 0 ? constraints.join(', ') : undefined,
        });
      }
    }

    // Collect inherited properties
    if (cls.parentClass) {
      let current: string | undefined = cls.parentClass;
      const visited = new Set<string>();
      while (current && !visited.has(current)) {
        visited.add(current);
        for (const [, prop] of ontology.datatypeProperties) {
          if (prop.domain === current) {
            const exists = properties.some(p => p.name === prop.name);
            if (!exists) {
              properties.push({
                name: prop.name,
                type: prop.datatype,
                required: prop.required,
                description: `Inherited from ${current}: ${prop.name}`,
                defaultValue: prop.defaultValue,
              });
            }
          }
        }
        const parentCls = ontology.classes.get(current);
        current = parentCls?.parentClass;
      }
    }

    // Collect object property relationships
    for (const [, prop] of ontology.objectProperties) {
      if (prop.domain === className) {
        const minCard = prop.minCardinality ?? 0;
        const maxCard = prop.maxCardinality;
        const cardinality = maxCard ? `${minCard}..${maxCard}` : `${minCard}..*`;

        relationships.push({
          name: prop.name,
          target: prop.range,
          cardinality,
          description: `${cls.label} ${prop.name} ${prop.range}`,
        });
      }
    }

    // Infer API endpoints
    const snake = this.toSnake(className);
    const apiEndpoints = [
      `GET    /api/v1/${snake}`,
      `GET    /api/v1/${snake}/:id`,
      `POST   /api/v1/${snake}`,
      `PUT    /api/v1/${snake}/:id`,
      `DELETE /api/v1/${snake}/:id`,
    ];

    // Infer UI pages
    const snakePlural = snake + 's';
    const uiPages = [
      `/admin/${snakePlural}`,
      `/admin/${snakePlural}/:id`,
    ];

    // Generate examples
    const examples: string[] = [];
    for (const [, ind] of ontology.individuals) {
      if (ind.classType === className) {
        examples.push(JSON.stringify(ind.properties, null, 2));
      }
    }
    if (examples.length === 0 && properties.length > 0) {
      const example: Record<string, unknown> = { id: `example-${snake}` };
      for (const prop of properties) {
        example[prop.name] = prop.defaultValue ?? (prop.type === 'string' ? `Example ${prop.name}` : prop.type === 'integer' ? 0 : null);
      }
      examples.push(JSON.stringify(example, null, 2));
    }

    return {
      className,
      description: cls.description,
      properties,
      relationships,
      examples,
      apiEndpoints,
      uiPages,
    };
  }

  // ── API Documentation ─────────────────────────────────────────────────────

  generateApiDocs(ontology: OntologyEngine): ApiDoc[] {
    const docs: ApiDoc[] = [];

    // Base ontology endpoints
    docs.push(
      {
        path: '/api/v1/ontology',
        method: 'GET',
        summary: 'Get full ontology',
        description: 'Returns the complete ontology with all classes, properties, and individuals.',
        parameters: [],
        responseExample: JSON.stringify({ success: true, data: { classes: [], objectProperties: [], datatypeProperties: [], individuals: [] } }, null, 2),
      },
      {
        path: '/api/v1/ontology',
        method: 'POST',
        summary: 'Save ontology version',
        description: 'Validates and saves a new ontology version with diff and checksum.',
        parameters: [],
        requestBody: 'SerializedOntology JSON',
        responseExample: JSON.stringify({ success: true, data: { version: 2, checksum: '...' } }, null, 2),
      },
      {
        path: '/api/v1/ontology/validate',
        method: 'POST',
        summary: 'Validate ontology',
        description: 'Runs full validation including cycle detection, orphaned refs, and missing domains.',
        parameters: [],
        responseExample: JSON.stringify({ success: true, data: { valid: true, errors: [], warnings: [] } }, null, 2),
      },
      {
        path: '/api/v1/ontology/schema',
        method: 'GET',
        summary: 'Generate schema',
        description: 'Generates a Prisma-compatible schema from the current ontology.',
        parameters: [],
        responseExample: JSON.stringify({ success: true, data: { models: [], prismaText: '' } }, null, 2),
      },
    );

    // Per-class CRUD endpoints
    for (const [, cls] of ontology.classes) {
      const snake = this.toSnake(cls.id);
      docs.push({
        path: `/api/v1/ontology/classes/${cls.id}`,
        method: 'GET',
        summary: `Get ${cls.label}`,
        description: `Returns the ${cls.label} entity with all its properties and relationships.`,
        parameters: [
          { name: 'id', in: 'path', required: true, type: 'string', description: `${cls.label} ID` },
        ],
        responseExample: JSON.stringify({ success: true, data: { id: `example-${snake}` } }, null, 2),
      });
    }

    // Schema endpoints
    docs.push(
      {
        path: '/api/v1/ontology/schema/validate',
        method: 'POST',
        summary: 'Validate schema against ontology',
        description: 'Validates the generated schema against the ontology definition.',
        parameters: [],
        responseExample: JSON.stringify({ success: true, data: { valid: true, stats: {} } }, null, 2),
      },
      {
        path: '/api/v1/ontology/schema/migration',
        method: 'POST',
        summary: 'Generate migration plan',
        description: 'Generates a migration plan between two ontology versions.',
        parameters: [],
        requestBody: '{ fromVersion: number, toVersion: number }',
        responseExample: JSON.stringify({ success: true, data: { steps: [] } }, null, 2),
      },
    );

    return docs;
  }

  // ── Architecture Documentation ────────────────────────────────────────────

  generateArchitectureDoc(ontology: OntologyEngine): string {
    const classCount = ontology.classes.size;
    const objPropCount = ontology.objectProperties.size;
    const dtPropCount = ontology.datatypeProperties.size;
    const indCount = ontology.individuals.size;
    const validation = ontology.validate();

    const lines = [
      '# iSCARB Architecture Overview',
      '',
      `> Generated from ontology v${ontology.version} — ${new Date().toISOString()}`,
      '',
      '## System Overview',
      '',
      'iSCARB is an ontology-driven academic management platform built on Next.js. The system uses a formal OWL ontology to define its domain model, from which database schemas, API endpoints, and UI pages are automatically generated.',
      '',
      '## Ontology Summary',
      '',
      `| Metric | Count |`,
      '|--------|-------|',
      `| Classes | ${classCount} |`,
      `| Object Properties | ${objPropCount} |`,
      `| Datatype Properties | ${dtPropCount} |`,
      `| Individuals | ${indCount} |`,
      `| Version | ${ontology.version} |`,
      `| Valid | ${validation.valid ? 'Yes' : 'No'} |`,
      `| Errors | ${validation.errors.length} |`,
      `| Warnings | ${validation.warnings.length} |`,
      '',
      '## Class Hierarchy',
      '',
    ];

    // Build hierarchy tree
    const rootClasses = Array.from(ontology.classes.values()).filter(c => !c.parentClass);
    const buildTree = (cls: OntologyClass, depth: number) => {
      const indent = '  '.repeat(depth);
      lines.push(`${indent}- **${cls.label}** (${cls.id}) — ${cls.description}`);
      const children = Array.from(ontology.classes.values()).filter(c => c.parentClass === cls.id);
      for (const child of children) {
        buildTree(child, depth + 1);
      }
    };
    for (const root of rootClasses) {
      buildTree(root, 0);
    }

    lines.push(
      '',
      '## Data Flow',
      '',
      '```',
      '┌─────────────┐     ┌──────────────┐     ┌──────────────┐',
      '│  Ontology    │────▶│  Schema Gen  │────▶│  Prisma DB   │',
      '│  Engine      │     │              │     │              │',
      '└─────────────┘     └──────────────┘     └──────────────┘',
      '       │                                        │',
      '       ▼                                        ▼',
      '┌─────────────┐     ┌──────────────┐     ┌──────────────┐',
      '│  RDF/Triple  │     │  API Routes  │     │  Frontend    │',
      '│  Store       │     │  (guard.js)  │     │  (Next.js)   │',
      '└─────────────┘     └──────────────┘     └──────────────┘',
      '```',
      '',
      '## Tech Stack',
      '',
      '- **Runtime**: Next.js (App Router)',
      '- **Database**: PostgreSQL via Prisma ORM',
      '- **Knowledge Graph**: In-memory triple store (RDF/SPARQL)',
      '- **Auth**: JWT + Bearer tokens with RBAC roles',
      '- **Observability**: OpenTelemetry + Sentry',
      '- **AI Integration**: Semantic model verification engine',
      '',
    );

    return lines.join('\n');
  }

  // ── Full Ontology Report ──────────────────────────────────────────────────

  generateOntologyReport(ontology: OntologyEngine): string {
    const validation = ontology.validate();
    const diagrams = this.generateMermaidDiagrams(ontology);

    const lines = [
      '# iSCARB Ontology Report',
      '',
      `> Version: ${ontology.version} | Generated: ${new Date().toISOString()}`,
      '',
      '## Overview',
      '',
      `This document describes the complete iSCARB domain ontology with ${ontology.classes.size} classes, ${ontology.objectProperties.size} object properties, and ${ontology.datatypeProperties.size} datatype properties.`,
      '',
      '## Validation',
      '',
      validation.valid ? '**Status: VALID**' : '**Status: INVALID**',
      '',
      validation.errors.length > 0
        ? `### Errors\n${validation.errors.map(e => `- ${e.message}`).join('\n')}`
        : 'No errors found.',
      '',
      validation.warnings.length > 0
        ? `### Warnings\n${validation.warnings.map(w => `- ${w.message}`).join('\n')}`
        : 'No warnings found.',
      '',
      '---',
      '',
      '## Class Definitions',
      '',
    ];

    for (const [, cls] of ontology.classes) {
      const dtProps = Array.from(ontology.datatypeProperties.values()).filter(p => p.domain === cls.id);
      const objProps = Array.from(ontology.objectProperties.values()).filter(p => p.domain === cls.id);

      lines.push(`### ${cls.label} (\`${cls.id}\`)`);
      lines.push('');
      lines.push(cls.description);
      lines.push('');

      if (cls.parentClass) {
        lines.push(`**Parent:** \`${cls.parentClass}\``);
        lines.push('');
      }

      if (dtProps.length > 0) {
        lines.push('**Properties:**');
        lines.push('');
        lines.push('| Name | Type | Required |');
        lines.push('|------|------|----------|');
        for (const prop of dtProps) {
          lines.push(`| ${prop.name} | ${prop.datatype} | ${prop.required ? 'Yes' : 'No'} |`);
        }
        lines.push('');
      }

      if (objProps.length > 0) {
        lines.push('**Relationships:**');
        lines.push('');
        lines.push('| Name | Target | Cardinality |');
        lines.push('|------|--------|-------------|');
        for (const prop of objProps) {
          const card = prop.maxCardinality ? `${prop.minCardinality ?? 0}..${prop.maxCardinality}` : `${prop.minCardinality ?? 0}..*`;
          lines.push(`| ${prop.name} | ${prop.range} | ${card} |`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    // Add diagrams
    lines.push('## Diagrams');
    lines.push('');
    for (const diagram of diagrams) {
      lines.push(`### ${diagram.name}`);
      lines.push('');
      lines.push('```mermaid');
      lines.push(diagram.code);
      lines.push('```');
      lines.push('');
    }

    return lines.join('\n');
  }

  // ── Mermaid Diagrams ──────────────────────────────────────────────────────

  generateMermaidDiagrams(ontology: OntologyEngine): { name: string; code: string }[] {
    const parsedOntology = ontologyEngineToOntology(ontology);

    return [
      { name: 'Class Diagram', code: generateMermaidClassDiagram(parsedOntology) },
      { name: 'ER Diagram', code: generateErDiagram(parsedOntology) },
      { name: 'Flowchart', code: generateMermaidFlowchart(parsedOntology) },
      {
        name: 'Property Overview',
        code: this.generatePropertyOverviewDiagram(ontology),
      },
      {
        name: 'Inheritance Tree',
        code: this.generateInheritanceTreeDiagram(ontology),
      },
    ];
  }

  private generatePropertyOverviewDiagram(ontology: OntologyEngine): string {
    const lines = ['flowchart LR'];

    for (const [, cls] of ontology.classes) {
      const dtCount = Array.from(ontology.datatypeProperties.values()).filter(p => p.domain === cls.id).length;
      const objCount = Array.from(ontology.objectProperties.values()).filter(p => p.domain === cls.id).length;
      if (dtCount > 0 || objCount > 0) {
        lines.push(`    ${cls.id}["${cls.label}<br/>${dtCount} props, ${objCount} rels"]`);
      }
    }

    for (const [, prop] of ontology.objectProperties) {
      lines.push(`    ${prop.domain} -->|${prop.name}| ${prop.range}`);
    }

    return lines.join('\n');
  }

  private generateInheritanceTreeDiagram(ontology: OntologyEngine): string {
    const lines = ['flowchart TD'];

    for (const [, cls] of ontology.classes) {
      if (cls.parentClass) {
        lines.push(`    ${cls.parentClass} --> ${cls.id}`);
      }
    }

    lines.push('');
    lines.push('    classDef parent fill:#fbbf24,stroke:#92400e,stroke-width:2px');
    lines.push('    classDef child fill:#60a5fa,stroke:#1e40af,stroke-width:1px');

    const parents = new Set<string>();
    for (const [, cls] of ontology.classes) {
      if (cls.parentClass) parents.add(cls.parentClass);
    }
    if (parents.size > 0) {
      lines.push(`    class ${Array.from(parents).join(',')} parent`);
    }

    return lines.join('\n');
  }

  // ── Release Report ────────────────────────────────────────────────────────

  generateReleaseReport(ontology: OntologyEngine, verification: FullVerificationReport): string {
    const validation = ontology.validate();

    const lines = [
      '# iSCARB Release Readiness Report',
      '',
      `> Generated: ${new Date().toISOString()} | Ontology v${ontology.version}`,
      '',
      '## Summary',
      '',
      `| Metric | Status |`,
      '|--------|--------|',
      `| Ontology Validation | ${validation.valid ? '✅ Pass' : '❌ Fail'} |`,
      `| Verification Score | ${verification.coverageScore}% |`,
      `| Drift Score | ${verification.driftScore}% |`,
      `| Overall | ${verification.valid ? '✅ Ready' : '⚠️ Needs Attention'} |`,
      '',
      '## Ontology Health',
      '',
      `- **Classes**: ${ontology.classes.size}`,
      `- **Object Properties**: ${ontology.objectProperties.size}`,
      `- **Datatype Properties**: ${ontology.datatypeProperties.size}`,
      `- **Individuals**: ${ontology.individuals.size}`,
      `- **Validation Errors**: ${validation.errors.length}`,
      `- **Validation Warnings**: ${validation.warnings.length}`,
      '',
    ];

    if (validation.errors.length > 0) {
      lines.push('## Errors (Must Fix)');
      lines.push('');
      for (const err of validation.errors) {
        lines.push(`- **${err.path}**: ${err.message}`);
      }
      lines.push('');
    }

    if (validation.warnings.length > 0) {
      lines.push('## Warnings (Should Fix)');
      lines.push('');
      for (const warn of validation.warnings) {
        lines.push(`- **${warn.path}**: ${warn.message}`);
      }
      lines.push('');
    }

    lines.push('## Layer Verification');
    lines.push('');
    if (verification.layers) {
      lines.push('| Layer | Status | Score |');
      lines.push('|-------|--------|-------|');
      for (const [layer, result] of Object.entries(verification.layers)) {
        lines.push(`| ${layer} | ${result.passed ? '✅' : '❌'} | ${result.score}% |`);
      }
      lines.push('');
    }

    if (verification.findings.length > 0) {
      lines.push('## Findings');
      lines.push('');
      for (const finding of verification.findings) {
        lines.push(`- ${finding}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push(verification.valid ? '*Release is ready.*' : '*Release blocked — fix issues above before proceeding.*');

    return lines.join('\n');
  }

  // ── Schema Documentation ──────────────────────────────────────────────────

  generateSchemaDocs(ontology: OntologyEngine): string {
    const lines = [
      '# iSCARB Database Schema Documentation',
      '',
      `> Auto-generated from ontology v${ontology.version}`,
      '',
      '## Tables',
      '',
    ];

    for (const [, cls] of ontology.classes) {
      const snake = this.toSnake(cls.id);
      const dtProps = Array.from(ontology.datatypeProperties.values()).filter(p => p.domain === cls.id);
      const objProps = Array.from(ontology.objectProperties.values()).filter(p => p.domain === cls.id);

      lines.push(`### ${snake}`);
      lines.push('');
      lines.push(`> ${cls.description}`);
      lines.push('');
      lines.push('| Column | Type | Nullable | Notes |');
      lines.push('|--------|------|----------|-------|');
      lines.push(`| id | String | No | Primary key |`);

      for (const prop of dtProps) {
        const dbType = this.mapToDbType(prop);
        lines.push(`| ${this.toSnake(prop.name)} | ${dbType} | ${prop.required ? 'No' : 'Yes'} | ${prop.unit ? `unit: ${prop.unit}` : ''} |`);
      }

      for (const prop of objProps) {
        lines.push(`| ${this.toSnake(prop.name)}_id | String | Yes | FK → ${this.toSnake(prop.range)}.id |`);
      }

      lines.push(`| created_at | DateTime | No | Timestamp |`);
      lines.push(`| updated_at | DateTime | No | Timestamp |`);
      lines.push('');
    }

    // Relations summary
    lines.push('## Foreign Key Relationships');
    lines.push('');
    lines.push('| From | To | Property |');
    lines.push('|------|----|----------|');
    for (const [, prop] of ontology.objectProperties) {
      lines.push(`| ${this.toSnake(prop.domain)} | ${this.toSnake(prop.range)} | ${prop.name} |`);
    }
    lines.push('');

    return lines.join('\n');
  }

  private mapToDbType(prop: DatatypeProperty): string {
    switch (prop.datatype) {
      case 'string': return prop.maxLength && prop.maxLength <= 255 ? `VARCHAR(${prop.maxLength})` : 'TEXT';
      case 'text': return 'TEXT';
      case 'integer': return 'INTEGER';
      case 'float': return 'DECIMAL(10,2)';
      case 'boolean': return 'BOOLEAN';
      case 'date': return 'DATE';
      case 'datetime': return 'TIMESTAMP';
      case 'json': return 'JSONB';
      default: return 'TEXT';
    }
  }

  // ── Generate All ──────────────────────────────────────────────────────────

  generateAllDocs(ontology: OntologyEngine): { file: string; content: string }[] {
    const files: { file: string; content: string }[] = [];

    // Master ontology report
    files.push({
      file: 'docs/ontology-report.md',
      content: this.generateOntologyReport(ontology),
    });

    // Architecture overview
    files.push({
      file: 'docs/architecture.md',
      content: this.generateArchitectureDoc(ontology),
    });

    // Schema documentation
    files.push({
      file: 'docs/schema.md',
      content: this.generateSchemaDocs(ontology),
    });

    // Per-entity docs
    for (const [id] of ontology.classes) {
      const entityDoc = this.generateEntityDocs(ontology, id);
      const lines = [
        `# ${entityDoc.description ? `${entityDoc.className} — ` : ''}${entityDoc.className}`,
        '',
        entityDoc.description,
        '',
        '## Properties',
        '',
        entityDoc.properties.length > 0
          ? entityDoc.properties.map(p => `- **${p.name}** (${p.type}${p.required ? ', required' : ''}): ${p.description}${p.constraints ? ` — ${p.constraints}` : ''}`).join('\n')
          : 'No properties defined.',
        '',
        '## Relationships',
        '',
        entityDoc.relationships.length > 0
          ? entityDoc.relationships.map(r => `- **${r.name}** → ${r.target} (${r.cardinality})`).join('\n')
          : 'No relationships defined.',
        '',
        '## API Endpoints',
        '',
        entityDoc.apiEndpoints.map(e => `\`${e}\``).join('\n'),
        '',
        '## UI Pages',
        '',
        entityDoc.uiPages.map(p => `- \`${p}\``).join('\n'),
        '',
      ];

      if (entityDoc.examples.length > 0) {
        lines.push('## Examples', '');
        for (const ex of entityDoc.examples) {
          lines.push('```json');
          lines.push(ex);
          lines.push('```');
          lines.push('');
        }
      }

      files.push({
        file: `docs/entities/${this.toSnake(id)}.md`,
        content: lines.join('\n'),
      });
    }

    // API docs
    const apiDocs = this.generateApiDocs(ontology);
    const apiLines = [
      '# iSCARB API Documentation',
      '',
      `> Generated: ${new Date().toISOString()}`,
      '',
    ];
    for (const doc of apiDocs) {
      apiLines.push(`## ${doc.method} \`${doc.path}\``);
      apiLines.push('');
      apiLines.push(`**${doc.summary}**`);
      apiLines.push('');
      apiLines.push(doc.description);
      apiLines.push('');
      if (doc.parameters.length > 0) {
        apiLines.push('### Parameters');
        apiLines.push('');
        apiLines.push('| Name | In | Required | Type | Description |');
        apiLines.push('|------|----|----------|------|-------------|');
        for (const p of doc.parameters) {
          apiLines.push(`| ${p.name} | ${p.in} | ${p.required ? 'Yes' : 'No'} | ${p.type} | ${p.description} |`);
        }
        apiLines.push('');
      }
      if (doc.requestBody) {
        apiLines.push(`### Request Body\n\n\`${doc.requestBody}\``);
        apiLines.push('');
      }
      apiLines.push('### Response');
      apiLines.push('');
      apiLines.push('```json');
      apiLines.push(doc.responseExample);
      apiLines.push('```');
      apiLines.push('');
      apiLines.push('---');
      apiLines.push('');
    }
    files.push({ file: 'docs/api.md', content: apiLines.join('\n') });

    // Mermaid diagrams
    const diagrams = this.generateMermaidDiagrams(ontology);
    for (const diagram of diagrams) {
      const snakeName = diagram.name.toLowerCase().replace(/\s+/g, '-');
      files.push({
        file: `docs/diagrams/${snakeName}.mmd`,
        content: diagram.code,
      });
    }

    return files;
  }
}
