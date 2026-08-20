/**
 * API IR — the API service projection of the semantic model.
 *
 * Describes generated REST/GraphQL endpoints, schemas, and policies.
 */
import type { ApiMethod, ApiProtocol } from './types';

// ────────────────────────────────────────────────────────────────────────────
// Top-level API model
// ────────────────────────────────────────────────────────────────────────────

export interface ApiServiceIR {
  /** Source ontology version */
  ontologyVersion: number;
  compiledAt: string;

  /** All entities exposed as API resources */
  resources: ApiResourceIR[];
  /** Custom endpoints beyond standard CRUD */
  customEndpoints: ApiEndpointIR[];
  /** GraphQL schema objects */
  graphqlTypes: GraphQLTypeIR[];
  /** OpenAPI / Swagger specification */
  openApiSpec?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// API Resource (CRUD for an entity)
// ────────────────────────────────────────────────────────────────────────────

export interface ApiResourceIR {
  /** Entity name */
  entity: string;
  /** Base route path (e.g. "/api/v1/generated/students") */
  basePath: string;
  /** Human-readable label */
  label: string;
  /** Description */
  description?: string;

  /** Standard CRUD endpoints */
  endpoints: ApiEndpointIR[];

  /** Validation rules derived from SHACL + ontology */
  validationRules: ValidationRuleIR[];

  /** Permission policies */
  permissionPolicies: PermissionPolicyIR[];

  /** Search configuration */
  searchConfig?: SearchConfigIR;

  /** Whether this resource is auto-generated */
  isGenerated: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// API Endpoint
// ────────────────────────────────────────────────────────────────────────────

export interface ApiEndpointIR {
  id: string;
  method: ApiMethod;
  path: string;
  protocol: ApiProtocol;
  /** Description of what the endpoint does */
  description: string;

  /** Entity operated on */
  entity: string;
  /** Action: list, get, create, update, delete, search, custom */
  action: string;

  /** Request parameters */
  requestParams: ApiParamIR[];
  /** Request body schema (for POST/PATCH) */
  requestBody?: ApiSchemaIR;
  /** Response schema */
  responseBody?: ApiSchemaIR;

  /** Error responses */
  errorResponses: ApiErrorIR[];

  /** Required permissions */
  requiredPermissions: string[];
  /** Rate limit tier */
  rateLimitTier?: string;

  /** Whether to log audit events */
  auditLogged: boolean;
  /** Whether to generate RDF triples */
  rdfSync: boolean;
}

export interface ApiParamIR {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  type: string;
  description?: string;
  example?: string;
}

export interface ApiSchemaIR {
  /** JSON Schema / OpenAPI schema object */
  type: string;
  properties: ApiSchemaPropertyIR[];
  required: string[];
  example?: Record<string, unknown>;
}

export interface ApiSchemaPropertyIR {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  example?: unknown;
  /** Reference to an entity */
  ref?: string;
  /** Whether this is a relation (object property) */
  isRelation: boolean;
}

export interface ApiErrorIR {
  statusCode: number;
  description: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Validation Rule
// ────────────────────────────────────────────────────────────────────────────

export interface ValidationRuleIR {
  id: string;
  field?: string;
  type: 'required' | 'type-check' | 'pattern' | 'min-length' | 'max-length' | 'range' | 'unique' | 'enum' | 'custom';
  rule: string;
  message: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Permission Policy
// ────────────────────────────────────────────────────────────────────────────

export interface PermissionPolicyIR {
  action: string;
  /** Roles that can perform this action */
  allowedRoles: string[];
  /** Attribute-based condition expression (e.g. "entity.department == user.department") */
  condition?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Search Configuration
// ────────────────────────────────────────────────────────────────────────────

export interface SearchConfigIR {
  searchableFields: string[];
  filterableFields: string[];
  sortableFields: string[];
  defaultSort: string;
  fullTextFields: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// GraphQL Types
// ────────────────────────────────────────────────────────────────────────────

export interface GraphQLTypeIR {
  name: string;
  kind: 'type' | 'input' | 'enum' | 'interface';
  fields: GraphQLFieldIR[];
  description?: string;
}

export interface GraphQLFieldIR {
  name: string;
  type: string;
  required: boolean;
  isList: boolean;
  description?: string;
  /** Resolver for this field (built-in or custom) */
  resolver?: string;
}
