/**
 * API Generator — Builder #08
 *
 * Consumes SemanticModelIR → produces REST/GraphQL API endpoints, validation
 * rules, permission policies, and OpenAPI specification.
 *
 * Generates runtime metadata consumed by a generic API handler, not files.
 */
import type { Builder, BuildContext } from '@/lib/semantic-model/orchestration/builder-engine';
import type { SemanticModelIR, EntityIR, ArtifactManifest, ArtifactEntry, CompilerDiagnostic, TraceLinkIR } from '@/lib/semantic-model/ir/types';
import type { ApiServiceIR, ApiResourceIR, ApiEndpointIR, ApiSchemaIR, ValidationRuleIR, PermissionPolicyIR, SearchConfigIR, GraphQLTypeIR, ApiSchemaPropertyIR } from '@/lib/semantic-model/ir/api-ir';
import { contentHash } from '@/builders/_shared/hash';

export const API_BUILDER_ID = 'api-generator';
export const API_BUILDER_VERSION = '0.1.0';

// ────────────────────────────────────────────────────────────────────────────
// API Builder
// ────────────────────────────────────────────────────────────────────────────

export const apiBuilder: Builder = {
  id: API_BUILDER_ID,
  name: 'API Generator',
  version: API_BUILDER_VERSION,
  dependsOn: ['database-generator'],

  async build(ctx: BuildContext): Promise<ArtifactManifest> {
    const ir = ctx.getIR();
    const diagnostics: CompilerDiagnostic[] = [];
    const artifacts: ArtifactEntry[] = [];

    const apiService = generateApiService(ir, diagnostics);

    for (const resource of apiService.resources) {
      artifacts.push({
        artifactType: 'api-schema',
        artifactId: `api_resource_${resource.entity}`,
        name: `${resource.entity} API Resource`,
        location: `api/resources/${resource.entity.toLowerCase()}.json`,
        checksum: contentHash(JSON.stringify(resource)),
        status: 'created',
        metadata: {
          entity: resource.entity,
          basePath: resource.basePath,
          endpoints: String(resource.endpoints.length),
        },
      });

      for (const endpoint of resource.endpoints) {
        artifacts.push({
          artifactType: 'api-endpoint',
          artifactId: `api_${endpoint.method}_${endpoint.path}`,
          name: `${endpoint.method} ${endpoint.path}`,
          location: `api/endpoints/${endpoint.id}.json`,
          checksum: contentHash(endpoint.path),
          status: 'created',
          metadata: {
            method: endpoint.method,
            path: endpoint.path,
            action: endpoint.action,
            permissions: endpoint.requiredPermissions.join(', '),
          },
        });
      }
    }

    const traceLinks: TraceLinkIR[] = [];
    for (const entity of ir.entities) {
      if (entity.projectionMode === 'generated-greenfield' || entity.projectionMode === 'generated-authoritative') {
        traceLinks.push({
          id: `trace_api_${entity.name}`,
          sourceType: 'ontology-class',
          sourceId: entity.name,
          targetType: 'api-endpoint',
          targetId: `api_resource_${entity.name}`,
          relation: 'implements',
          confidence: 1.0,
          createdAt: new Date().toISOString(),
        });
      }
    }

    for (const diag of diagnostics) {
      ctx.addDiagnostic(diag);
    }

    return {
      builderId: API_BUILDER_ID,
      builderVersion: API_BUILDER_VERSION,
      builtAt: new Date().toISOString(),
      ontologyVersion: ir.ontologyVersion,
      irVersion: ir.irVersion,
      artifacts,
      checksums: { openApi: contentHash(JSON.stringify(apiService)) },
      traceLinks,
      warnings: diagnostics.filter(d => d.severity === 'warning').map(d => d.message),
    };
  },
};

// ────────────────────────────────────────────────────────────────────────────
// API Service Generator
// ────────────────────────────────────────────────────────────────────────────

export function generateApiService(
  ir: SemanticModelIR,
  diagnostics: CompilerDiagnostic[],
): ApiServiceIR {
  const resources: ApiResourceIR[] = [];
  const graphqlTypes: GraphQLTypeIR[] = [];

  for (const entity of ir.entities) {
    if (entity.projectionMode === 'legacy-observed') continue;

    const resource = generateResource(entity, ir, diagnostics);
    resources.push(resource);

    const graphqlType = generateGraphQLType(entity, ir);
    graphqlTypes.push(graphqlType);
  }

  const openApiSpec = generateOpenApiSpec(resources);

  return {
    ontologyVersion: ir.ontologyVersion,
    compiledAt: new Date().toISOString(),
    resources,
    customEndpoints: [],
    graphqlTypes,
    openApiSpec,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Resource Generator
// ────────────────────────────────────────────────────────────────────────────

function generateResource(
  entity: EntityIR,
  ir: SemanticModelIR,
  diagnostics: CompilerDiagnostic[],
): ApiResourceIR {
  const basePath = `/api/v1/generated/${entity.name.toLowerCase()}s`;
  const endpoints: ApiEndpointIR[] = [];

  // Look up permissions from the IR's permission array rather than entity annotations
  // EntityIR.annotations is Record<string, string> — not a nested permission object
  const entityPerms = ir.permissions.filter(p => p.entity === entity.name);
  const defaultReadRoles = ['admin', 'faculty', 'student'];

  const readRoles = entityPerms.find(p => p.actions.includes('read'))?.roles ?? defaultReadRoles;
  const createRoles = entityPerms.find(p => p.actions.includes('create'))?.roles ?? ['admin'];
  const updateRoles = entityPerms.find(p => p.actions.includes('update'))?.roles ?? ['admin', 'faculty'];
  const deleteRoles = entityPerms.find(p => p.actions.includes('delete'))?.roles ?? ['admin'];

  // Determine default sort field — check for 'name' or 'title' property
  const defaultSortField = entity.ownedProperties.find(
    r => r.name === 'name' || r.name === 'title'
  )?.name || 'createdAt';

  // LIST endpoint
  endpoints.push({
    id: `api_${entity.name}_list`,
    method: 'GET',
    path: basePath,
    protocol: 'rest',
    description: `List ${entity.label} entities with filtering and pagination`,
    entity: entity.name,
    action: 'list',
    requestParams: [
      { name: 'page', in: 'query', required: false, type: 'integer', description: 'Page number (1-based)' },
      { name: 'limit', in: 'query', required: false, type: 'integer', description: 'Items per page (max 100)' },
      { name: 'sort', in: 'query', required: false, type: 'string', description: 'Sort field' },
      { name: 'order', in: 'query', required: false, type: 'string', description: 'Sort order (asc|desc)' },
    ],
    requiredPermissions: entity.projectionMode === 'generated-authoritative' ? ['admin'] : readRoles,
    auditLogged: false,
    rdfSync: false,
    errorResponses: [
      { statusCode: 401, description: 'Unauthorized' },
      { statusCode: 403, description: 'Forbidden' },
    ],
  });

  // GET by ID
  endpoints.push({
    id: `api_${entity.name}_get`,
    method: 'GET',
    path: `${basePath}/:id`,
    protocol: 'rest',
    description: `Get a single ${entity.label} by ID`,
    entity: entity.name,
    action: 'get',
    requestParams: [
      { name: 'id', in: 'path', required: true, type: 'string', description: 'Entity ID' },
    ],
    requiredPermissions: readRoles,
    auditLogged: false,
    rdfSync: false,
    errorResponses: [
      { statusCode: 404, description: 'Not found' },
    ],
  });

  // CREATE endpoint
  endpoints.push({
    id: `api_${entity.name}_create`,
    method: 'POST',
    path: basePath,
    protocol: 'rest',
    description: `Create a new ${entity.label}`,
    entity: entity.name,
    action: 'create',
    requestParams: [],
    requestBody: generateSchema(entity, ir),
    responseBody: generateSchema(entity, ir),
    requiredPermissions: createRoles,
    auditLogged: true,
    rdfSync: true,
    errorResponses: [
      { statusCode: 400, description: 'Validation error' },
      { statusCode: 422, description: 'Unprocessable entity' },
    ],
  });

  // UPDATE endpoint
  endpoints.push({
    id: `api_${entity.name}_update`,
    method: 'PATCH',
    path: `${basePath}/:id`,
    protocol: 'rest',
    description: `Update an existing ${entity.label}`,
    entity: entity.name,
    action: 'update',
    requestParams: [
      { name: 'id', in: 'path', required: true, type: 'string', description: 'Entity ID' },
    ],
    requiredPermissions: updateRoles,
    auditLogged: true,
    rdfSync: true,
    errorResponses: [
      { statusCode: 404, description: 'Not found' },
      { statusCode: 422, description: 'Validation error' },
    ],
  });

  // DELETE (deprecate) endpoint
  endpoints.push({
    id: `api_${entity.name}_delete`,
    method: 'DELETE',
    path: `${basePath}/:id`,
    protocol: 'rest',
    description: `Deprecate/soft-delete a ${entity.label}`,
    entity: entity.name,
    action: 'delete',
    requestParams: [
      { name: 'id', in: 'path', required: true, type: 'string', description: 'Entity ID' },
    ],
    requiredPermissions: deleteRoles,
    auditLogged: true,
    rdfSync: true,
    errorResponses: [
      { statusCode: 404, description: 'Not found' },
    ],
  });

  // Validation rules from property constraints
  const validationRules: ValidationRuleIR[] = [];
  for (const propRef of entity.ownedProperties) {
    const propDef = ir.properties.find(
      p => p.propertyId === propRef.propertyId || p.name === propRef.name
    );
    if (!propDef) continue;

    if (propDef.required) {
      validationRules.push({
        id: `val_${entity.name}_${propDef.name}_required`,
        field: propDef.name,
        type: 'required',
        rule: `${propDef.name} is required`,
        message: `${propDef.label} is required`,
      });
    }

    if (propDef.pattern) {
      validationRules.push({
        id: `val_${entity.name}_${propDef.name}_pattern`,
        field: propDef.name,
        type: 'pattern',
        rule: propDef.pattern,
        message: `Invalid format for ${propDef.label}`,
      });
    }

    if (propDef.minLength) {
      validationRules.push({
        id: `val_${entity.name}_${propDef.name}_minlength`,
        field: propDef.name,
        type: 'min-length',
        rule: `>= ${propDef.minLength}`,
        message: `Minimum length is ${propDef.minLength}`,
      });
    }

    if (propDef.maxLength) {
      validationRules.push({
        id: `val_${entity.name}_${propDef.name}_maxlength`,
        field: propDef.name,
        type: 'max-length',
        rule: `<= ${propDef.maxLength}`,
        message: `Maximum length is ${propDef.maxLength}`,
      });
    }
  }

  // Permission policies
  const permissionPolicies: PermissionPolicyIR[] = [
    { action: 'create', allowedRoles: createRoles },
    { action: 'read', allowedRoles: readRoles },
    { action: 'update', allowedRoles: updateRoles },
    { action: 'delete', allowedRoles: deleteRoles },
  ];

  // Search configuration
  const searchConfig: SearchConfigIR = {
    searchableFields: entity.ownedProperties
      .map(r => r.name)
      .filter(name => ir.properties.find(p => p.name === name)?.searchable),
    filterableFields: entity.ownedProperties
      .map(r => r.name)
      .filter(name => ir.properties.find(p => p.name === name)?.filterable),
    sortableFields: entity.ownedProperties
      .map(r => r.name)
      .filter(name => ir.properties.find(p => p.name === name)?.sortable),
    defaultSort: defaultSortField,
    fullTextFields: entity.ownedProperties
      .map(r => r.name)
      .filter(name => ir.properties.find(p => p.name === name)?.fullText),
  };

  return {
    entity: entity.name,
    basePath,
    label: entity.label,
    description: entity.description,
    endpoints,
    validationRules,
    permissionPolicies,
    searchConfig,
    isGenerated: entity.projectionMode !== 'legacy-mapped',
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Schema Generator
// ────────────────────────────────────────────────────────────────────────────

function generateSchema(entity: EntityIR, ir: SemanticModelIR): ApiSchemaIR {
  const properties: ApiSchemaPropertyIR[] = [];

  for (const propRef of entity.ownedProperties) {
    const propDef = ir.properties.find(
      p => p.propertyId === propRef.propertyId || p.name === propRef.name
    );
    if (!propDef || !propDef.apiWritable) continue;

    properties.push({
      name: propDef.name,
      type: mapToJsonSchemaType(propDef.datatype),
      required: propDef.required,
      description: propDef.label,
      example: propDef.defaultValue,
      isRelation: false,
    });
  }

  return {
    type: 'object',
    properties,
    required: entity.ownedProperties.filter(r => r.required).map(r => r.name),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// GraphQL Type Generator
// ────────────────────────────────────────────────────────────────────────────

function generateGraphQLType(entity: EntityIR, ir: SemanticModelIR): GraphQLTypeIR {
  const fields = entity.ownedProperties.map(propRef => {
    const propDef = ir.properties.find(
      p => p.propertyId === propRef.propertyId || p.name === propRef.name
    );
    const gqlType = propDef ? mapToGraphQLType(propDef.datatype) : 'String';
    return {
      name: propRef.name,
      type: gqlType,
      required: propRef.required,
      isList: false,
      description: propDef?.label,
    };
  });

  return {
    name: entity.name,
    kind: 'type',
    fields,
    description: entity.description,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// OpenAPI Spec Generator
// ────────────────────────────────────────────────────────────────────────────

function generateOpenApiSpec(resources: ApiResourceIR[]): string {
  const paths: Record<string, any> = {};
  const schemas: Record<string, any> = {};

  for (const resource of resources) {
    for (const endpoint of resource.endpoints) {
      const pathKey = endpoint.path.replace(/:(\w+)/g, '{$1}');
      if (!paths[pathKey]) paths[pathKey] = {};

      const operation: any = {
        operationId: endpoint.id,
        summary: endpoint.description,
        tags: [resource.entity],
        parameters: endpoint.requestParams.map(p => ({
          name: p.name,
          in: p.in,
          required: p.required,
          schema: { type: p.type },
          description: p.description,
        })),
        responses: {
          '200': { description: 'Success' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      };

      if (endpoint.requestBody) {
        const schemaName = `${resource.entity}Input`;
        schemas[schemaName] = {
          type: endpoint.requestBody.type,
          properties: Object.fromEntries(
            endpoint.requestBody.properties.map(p => [
              p.name, { type: p.type, description: p.description }
            ])
          ),
          required: endpoint.requestBody.required,
        };
        operation.requestBody = {
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${schemaName}` },
            },
          },
        };
      }

      paths[pathKey][endpoint.method.toLowerCase()] = operation;
    }
  }

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'iSCARB Generated API',
      version: '1.0.0',
      description: 'Auto-generated REST API from ontology',
    },
    paths,
    components: { schemas },
  };

  return JSON.stringify(spec, null, 2);
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function mapToJsonSchemaType(datatype: string): string {
  const map: Record<string, string> = {
    string: 'string',
    integer: 'integer',
    float: 'number',
    boolean: 'boolean',
    date: 'string',
    datetime: 'string',
    text: 'string',
    json: 'object',
  };
  return map[datatype] || 'string';
}

function mapToGraphQLType(datatype: string): string {
  const map: Record<string, string> = {
    string: 'String',
    integer: 'Int',
    float: 'Float',
    boolean: 'Boolean',
    date: 'DateTime',
    datetime: 'DateTime',
    text: 'String',
    json: 'JSON',
  };
  return map[datatype] || 'String';
}
