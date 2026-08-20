/**
 * Semantic Model IR — the core intermediate representation that all builders consume.
 *
 * This IR is compiled from the ontology engine, annotations, SHACL constraints,
 * requirement links, and platform metadata. Every downstream generator reads
 * this IR rather than interpreting the ontology directly.
 *
 * The IR is the single contract between Authoring and Generation.
 */
import type { OntologyClass, ObjectProperty, DatatypeProperty } from '@/lib/ontology/engine';

// ────────────────────────────────────────────────────────────────────────────
// Top-level container
// ────────────────────────────────────────────────────────────────────────────

export interface SemanticModelIR {
  /** IR model version (bumped when the IR schema changes) */
  irVersion: string;
  /** Source ontology version that produced this IR */
  ontologyVersion: number;
  /** When this IR was compiled */
  compiledAt: string;
  /** Known namespace prefixes */
  namespaces: Record<string, string>;

  /** All entity (class) definitions with merged semantics */
  entities: EntityIR[];
  /** All relationships (object properties) */
  relationships: RelationshipIR[];
  /** All scalar properties (datatype properties) */
  properties: PropertyIR[];
  /** Workflow definitions */
  workflows: WorkflowIR[];
  /** Permission/role definitions */
  permissions: PermissionIR[];
  /** Captured requirements (from Vision builder) */
  requirements: RequirementIR[];
  /** UI view / page definitions */
  views: ViewIR[];
  /** API endpoint definitions */
  api: ApiEndpointIR[];
  /** Analytics / KPI definitions */
  analytics: AnalyticsIR[];
  /** Deployment topology definitions */
  deployment: DeploymentIR[];
  /** Test specifications */
  tests: TestSpecIR[];
  /** Traceability links across the whole chain */
  traceability: TraceLinkIR[];
  /** Compiler diagnostics (warnings, errors) */
  diagnostics: CompilerDiagnostic[];
}

// ────────────────────────────────────────────────────────────────────────────
// Entity (class) IR
// ────────────────────────────────────────────────────────────────────────────

export type ProjectionMode = 'legacy-observed' | 'legacy-mapped' | 'generated-greenfield' | 'generated-authoritative';
export type AuthorityMode = 'ontology' | 'database' | 'shared-transition';

export interface EntityIR {
  /** Entity class name (e.g. "Student") */
  name: string;
  /** Human-readable label */
  label: string;
  /** Arabic label when available */
  labelAr?: string;
  /** Description / comment */
  description: string;
  /** Parent class for inheritance */
  parentClass?: string;
  /** All ancestor class names (resolved during compilation) */
  ancestorClasses: string[];
  /** Inherited property IDs */
  inheritedProperties: string[];

  /** How this entity is managed in the platform */
  projectionMode: ProjectionMode;
  /** Which system is the authority */
  authority: AuthorityMode;
  /** Migration stage */
  migrationStage: 'observe' | 'mapped' | 'generated' | 'cutover';

  /** Datatype properties owned directly by this entity */
  ownedProperties: PropertyRef[];
  /** Object properties where this entity is the domain (subject) */
  outgoingRelationships: RelationshipRef[];
  /** Object properties where this entity is the range (object) */
  incomingRelationships: RelationshipRef[];

  /** OWL restrictions */
  restrictions: RestrictionIR[];
  /** Platform annotations */
  annotations: Record<string, string>;
  /** Equivalent classes (from owl:equivalentClass) */
  equivalentClasses: string[];
  /** Disjoint classes (from owl:disjointWith) */
  disjointWith: string[];

  /** Ontology source file */
  sourceFile?: string;
  /** Ontology source line number */
  sourceLine?: number;
  /** Version info from ontology */
  versionInfo: string;
}

export interface PropertyRef {
  propertyId: string;
  name: string;
  required: boolean;
}

export interface RelationshipRef {
  relationshipId: string;
  name: string;
  targetEntity: string;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface RestrictionIR {
  type: 'minCardinality' | 'maxCardinality' | 'exactCardinality' | 'someValuesFrom' | 'allValuesFrom' | 'hasValue';
  property: string;
  value?: any;
}

// ────────────────────────────────────────────────────────────────────────────
// Object property (relationship) IR
// ────────────────────────────────────────────────────────────────────────────

export interface RelationshipIR {
  id: string;
  name: string;
  label: string;
  domain: string;     // Domain entity name
  range: string;      // Range entity name
  inverse?: string;    // Inverse property name

  /** OWL characteristics */
  characteristics: ('functional' | 'inverseFunctional' | 'transitive' | 'symmetric' | 'reflexive')[];
  subPropertyOf?: string;

  /** Resolved cardinality based on restrictions + characteristics */
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many';
  minCardinality?: number;
  maxCardinality?: number;

  /** How this relationship is stored in the relational layer */
  storageStrategy: 'foreign-key' | 'join-table' | 'embedded';
  /** Whether the relationship should be exposed in APIs */
  exposedInApi: boolean;
  /** Whether the relationship should be shown in UI */
  exposedInUI: boolean;

  annotations: Record<string, string>;
  sourceFile?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Datatype property IR
// ────────────────────────────────────────────────────────────────────────────

export type PropertyDataType = 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime' | 'text' | 'json';

export interface PropertyIR {
  id: string;
  name: string;
  label: string;
  domain: string;        // Owning entity
  datatype: PropertyDataType;
  required: boolean;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;       // Regex pattern
  unit?: string;

  /** Storage metadata */
  sqlType: string;        // e.g. "TEXT", "INTEGER", "NUMERIC(5,2)"
  sqlNullable: boolean;
  sqlUnique: boolean;
  sqlIndexed: boolean;
  sqlDefault?: string;

  /** Search metadata */
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
  fullText: boolean;
  vectorized: boolean;

  /** UI metadata */
  uiWidget: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'datetime' | 'checkbox' | 'email' | 'url' | 'json-editor';
  uiSection?: string;
  uiOrder?: number;
  uiReadOnly: boolean;

  /** API metadata */
  exposedInApi: boolean;
  apiWritable: boolean;

  annotations: Record<string, string>;
  sourceFile?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Workflow IR
// ────────────────────────────────────────────────────────────────────────────

export interface WorkflowIR {
  id: string;
  name: string;
  label: string;
  /** Entity this workflow applies to */
  entity: string;
  /** States and transitions */
  states: WorkflowStateIR[];
  transitions: WorkflowTransitionIR[];
  /** Initial state */
  initialState: string;
  annotations: Record<string, string>;
}

export interface WorkflowStateIR {
  name: string;
  label: string;
  description?: string;
  /** Roles allowed to view entities in this state */
  viewerRoles: string[];
  /** Roles allowed to transition out of this state */
  actorRoles: string[];
}

export interface WorkflowTransitionIR {
  from: string;
  to: string;
  label: string;
  /** Roles permitted to execute this transition */
  allowedRoles: string[];
  /** Side effects (e.g. send notification, generate triples, run hook) */
  hooks: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Permission IR
// ────────────────────────────────────────────────────────────────────────────

export interface PermissionIR {
  id: string;
  name: string;
  label: string;
  /** Entity this permission is for */
  entity?: string;
  /** CRUD actions: create, read, update, delete, deprecate */
  actions: string[];
  /** Roles granted this permission */
  roles: string[];
  annotations: Record<string, string>;
}

// ────────────────────────────────────────────────────────────────────────────
// Requirement IR
// ────────────────────────────────────────────────────────────────────────────

export interface RequirementIR {
  id: string;
  title: string;
  description: string;
  /** Entities that satisfy this requirement */
  satisfiesEntities: string[];
  /** Priority */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Source reference */
  source?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// View / UI IR
// ────────────────────────────────────────────────────────────────────────────

export type ViewType = 'list' | 'detail' | 'form' | 'dashboard' | 'search' | 'workflow' | 'graph' | 'audit';

export interface ViewIR {
  id: string;
  name: string;
  label: string;
  type: ViewType;
  /** Entity this view is for */
  entity: string;
  /** Route path (e.g. "/generated/students") */
  route: string;
  /** Columns/fields to display */
  fields: ViewFieldIR[];
  /** Filters */
  filters: ViewFilterIR[];
  /** Related entities to include */
  relatedViews: string[];
  /** Permissions needed to access this view */
  requiredPermissions: string[];
  annotations: Record<string, string>;
}

export interface ViewFieldIR {
  propertyId: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
  widget?: string;
}

export interface ViewFilterIR {
  propertyId: string;
  type: 'text' | 'select' | 'date-range' | 'number-range' | 'boolean';
  label: string;
}

// ────────────────────────────────────────────────────────────────────────────
// API IR
// ────────────────────────────────────────────────────────────────────────────

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
export type ApiProtocol = 'rest' | 'graphql';

export interface ApiEndpointIR {
  id: string;
  method: ApiMethod;
  path: string;
  /** Entity this endpoint operates on */
  entity: string;
  /** Description of what the endpoint does */
  description: string;
  protocol: ApiProtocol;
  /** Request body / query parameters */
  parameters: ApiParameterIR[];
  /** Response shape */
  responseEntity?: string;
  /** Permissions required */
  requiredPermissions: string[];
  annotations: Record<string, string>;
}

export interface ApiParameterIR {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  required: boolean;
  type: string;
  description?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Analytics IR
// ────────────────────────────────────────────────────────────────────────────

export interface AnalyticsIR {
  id: string;
  name: string;
  label: string;
  /** Entity being measured */
  entity: string;
  /** Metric expressions */
  metrics: AnalyticsMetricIR[];
  /** Dimension / group-by fields */
  dimensions: string[];
  annotations: Record<string, string>;
}

export interface AnalyticsMetricIR {
  name: string;
  expression: string;  // e.g. "COUNT(*)", "AVG(cgpa)", "SUM(credits)"
  unit?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Deployment IR
// ────────────────────────────────────────────────────────────────────────────

export interface DeploymentIR {
  id: string;
  serviceName: string;
  /** Generated domains deployed */
  entities: string[];
  /** Dependencies */
  dependencies: string[];  // e.g. ["postgres", "fuseki", "pgvector"]
  /** Environment variables required */
  envVars: string[];
  healthCheck?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Test IR
// ────────────────────────────────────────────────────────────────────────────

export type TestType = 'unit' | 'integration' | 'contract' | 'e2e' | 'permission' | 'workflow' | 'rdf-sync';

export interface TestSpecIR {
  id: string;
  name: string;
  type: TestType;
  /** Entity under test */
  entity: string;
  /** Test cases */
  cases: TestCaseIR[];
  annotations: Record<string, string>;
}

export interface TestCaseIR {
  name: string;
  description: string;
  /** Expected artifacts to verify */
  verifies: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Traceability IR
// ────────────────────────────────────────────────────────────────────────────

export type ArtifactType =
  | 'requirement'
  | 'ontology-class'
  | 'ontology-property'
  | 'ontology-relationship'
  | 'rdf-triple'
  | 'database-table'
  | 'database-column'
  | 'database-constraint'
  | 'api-endpoint'
  | 'api-schema'
  | 'ui-view'
  | 'ui-field'
  | 'ai-tool'
  | 'test-case'
  | 'documentation-page'
  | 'deployment-service'
  | 'monitoring-metric'
  | 'analytics-kpi';

export interface TraceLinkIR {
  id: string;
  sourceType: ArtifactType;
  sourceId: string;
  targetType: ArtifactType;
  targetId: string;
  /** Relationship: derives, implements, satisfies, tests, documents */
  relation: 'derives' | 'implements' | 'satisfies' | 'tests' | 'documents' | 'deploys' | 'monitors';
  /** Confidence in this link (0.0 - 1.0) */
  confidence: number;
  /** When the link was established */
  createdAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Compiler Diagnostics
// ────────────────────────────────────────────────────────────────────────────

export interface CompilerDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
  source?: 'ontology' | 'annotation' | 'mapping' | 'constraint' | 'verification';
}

// ────────────────────────────────────────────────────────────────────────────
// Builder Manifest — what each builder produces
// ────────────────────────────────────────────────────────────────────────────

export interface ArtifactManifest {
  builderId: string;
  builderVersion: string;
  builtAt: string;
  ontologyVersion: number;
  irVersion: string;

  /** Artifacts produced by this builder */
  artifacts: ArtifactEntry[];
  /** Checksums for change detection */
  checksums: Record<string, string>;
  /** Trace links generated */
  traceLinks: TraceLinkIR[];
  /** Warnings encountered during build */
  warnings: string[];
}

export interface ArtifactEntry {
  artifactType: ArtifactType;
  artifactId: string;
  /** Human-readable name */
  name: string;
  /** Where the artifact is stored (file path, db table, route) */
  location: string;
  /** Content hash */
  checksum: string;
  /** Whether this already existed or was newly generated */
  status: 'created' | 'updated' | 'unchanged' | 'deprecated';
  /** Metadata */
  metadata: Record<string, string>;
}
