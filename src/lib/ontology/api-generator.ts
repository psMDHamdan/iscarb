import { OntologyEngine, type OntologyClass, type ObjectProperty, type DatatypeProperty } from './engine';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GeneratedRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  auth: { required: boolean; roles: string[] };
  params: { name: string; type: string; required: boolean }[];
  body: { name: string; type: string; required: boolean }[];
  response: string;
  validation: string;
}

export interface ValidationRules {
  [className: string]: {
    create: Record<string, { type: string; required: boolean; constraints: string[] }>;
    update: Record<string, { type: string; required: boolean; constraints: string[] }>;
  };
}

export interface RbacMatrix {
  roles: string[];
  entities: string[];
  permissions: Record<string, Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }>>;
}

export interface EventSchema {
  name: string;
  trigger: string;
  entity: string;
  payload: Record<string, string>;
  description: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function camelToKebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function graphqlType(dt: string): string {
  const map: Record<string, string> = {
    string: 'String',
    integer: 'Int',
    float: 'Float',
    boolean: 'Boolean',
    date: 'String',
    datetime: 'String',
    text: 'String',
    json: 'JSON',
  };
  return map[dt] || 'String';
}

function dtToZod(dt: string, required: boolean): string {
  const base: Record<string, string> = {
    string: 'z.string()',
    integer: 'z.number().int()',
    float: 'z.number()',
    boolean: 'z.boolean()',
    date: 'z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)',
    datetime: 'z.string().datetime()',
    text: 'z.string()',
    json: 'z.record(z.unknown())',
  };
  let expr = base[dt] || 'z.string()';
  if (!required) expr += '.optional()';
  return expr;
}

function getClassDatatypeProps(engine: OntologyEngine, classId: string): DatatypeProperty[] {
  return Array.from(engine.datatypeProperties.values()).filter(p => p.domain === classId);
}

function getClassObjectProps(engine: OntologyEngine, classId: string): ObjectProperty[] {
  return Array.from(engine.objectProperties.values()).filter(p => p.domain === classId);
}

const SYSTEM_ROLES = ['admin', 'dean', 'faculty', 'student', 'staff'];

// ─── ApiGenerator ────────────────────────────────────────────────────────────

export class ApiGenerator {
  generateRestRoutes(ontology: OntologyEngine): GeneratedRoute[] {
    const routes: GeneratedRoute[] = [];
    const classes = Array.from(ontology.classes.values());

    for (const cls of classes) {
      const kebab = camelToKebab(cls.name);
      const dataProps = getClassDatatypeProps(ontology, cls.id);
      const objProps = getClassObjectProps(ontology, cls.id);

      // GET list
      routes.push({
        method: 'GET',
        path: `/api/v1/ontology/entities/${kebab}`,
        description: `List all ${cls.label} entities`,
        auth: { required: true, roles: ['admin', 'dean', 'faculty'] },
        params: [
          { name: 'page', type: 'number', required: false },
          { name: 'limit', type: 'number', required: false },
          { name: 'sort', type: 'string', required: false },
          { name: 'order', type: 'asc | desc', required: false },
        ],
        body: [],
        response: `{ ${cls.name}[], total: number, page: number }`,
        validation: `${cls.name}ListQuery`,
      });

      // GET by id
      routes.push({
        method: 'GET',
        path: `/api/v1/ontology/entities/${kebab}/[id]`,
        description: `Get a ${cls.label} by ID`,
        auth: { required: true, roles: ['admin', 'dean', 'faculty'] },
        params: [{ name: 'id', type: 'string', required: true }],
        body: [],
        response: cls.name,
        validation: `${cls.name}IdParam`,
      });

      // POST create
      routes.push({
        method: 'POST',
        path: `/api/v1/ontology/entities/${kebab}`,
        description: `Create a new ${cls.label}`,
        auth: { required: true, roles: ['admin', 'dean'] },
        params: [],
        body: dataProps.map(p => ({ name: p.name, type: p.datatype, required: p.required })),
        response: cls.name,
        validation: `${cls.name}Create`,
      });

      // PUT update
      routes.push({
        method: 'PUT',
        path: `/api/v1/ontology/entities/${kebab}/[id]`,
        description: `Update a ${cls.label}`,
        auth: { required: true, roles: ['admin', 'dean'] },
        params: [{ name: 'id', type: 'string', required: true }],
        body: dataProps.map(p => ({ name: p.name, type: p.datatype, required: false })),
        response: cls.name,
        validation: `${cls.name}Update`,
      });

      // DELETE
      routes.push({
        method: 'DELETE',
        path: `/api/v1/ontology/entities/${kebab}/[id]`,
        description: `Delete a ${cls.label}`,
        auth: { required: true, roles: ['admin'] },
        params: [{ name: 'id', type: 'string', required: true }],
        body: [],
        response: `{ deleted: boolean }`,
        validation: `${cls.name}IdParam`,
      });
    }

    return routes;
  }

  generateGraphqlSchema(ontology: OntologyEngine): string {
    const lines: string[] = [];
    lines.push('# Auto-generated GraphQL schema from iSCARB Ontology');
    lines.push('# Do not edit manually — regenerate via API Generator');
    lines.push('');

    // Scalar
    lines.push('scalar JSON');
    lines.push('scalar DateTime');
    lines.push('scalar Date');
    lines.push('');

    // Enums for relationships
    const classes = Array.from(ontology.classes.values());

    // Generate input types and object types per class
    for (const cls of classes) {
      const dataProps = getClassDatatypeProps(ontology, cls.id);
      const objProps = getClassObjectProps(ontology, cls.id);

      // Object type
      lines.push(`type ${cls.name} {`);
      lines.push(`  id: ID!`);
      for (const p of dataProps) {
        const gType = graphqlType(p.datatype);
        lines.push(`  ${p.name}: ${p.required ? gType + '!' : gType}`);
      }
      for (const p of objProps) {
        const targetClass = ontology.classes.get(p.range);
        if (targetClass) {
          const isList = p.maxCardinality !== 1;
          lines.push(`  ${p.name}: ${isList ? `[${p.range}!]` : p.range}`);
        }
      }
      lines.push(`  createdAt: DateTime`);
      lines.push(`  updatedAt: DateTime`);
      lines.push(`}`);
      lines.push('');

      // Create input
      lines.push(`input Create${cls.name}Input {`);
      for (const p of dataProps) {
        if (p.required) {
          lines.push(`  ${p.name}: ${graphqlType(p.datatype)}!`);
        }
      }
      for (const p of dataProps) {
        if (!p.required) {
          lines.push(`  ${p.name}: ${graphqlType(p.datatype)}`);
        }
      }
      lines.push(`}`);
      lines.push('');

      // Update input
      lines.push(`input Update${cls.name}Input {`);
      for (const p of dataProps) {
        lines.push(`  ${p.name}: ${graphqlType(p.datatype)}`);
      }
      for (const p of objProps) {
        lines.push(`  ${p.name}Id: ID`);
      }
      lines.push(`}`);
      lines.push('');

      // Filter input
      lines.push(`input ${cls.name}Filter {`);
      for (const p of dataProps) {
        lines.push(`  ${p.name}: String`);
      }
      lines.push(`  search: String`);
      lines.push(`}`);
      lines.push('');
    }

    // Root Query
    lines.push('type Query {');
    for (const cls of classes) {
      const kebab = camelToKebab(cls.name);
      lines.push(`  # ${cls.description}`);
      lines.push(`  ${kebab}(id: ID!): ${cls.name}`);
      lines.push(`  all${cls.name}s(filter: ${cls.name}Filter, page: Int, limit: Int): ${cls.name}Connection!`);
    }
    lines.push('  ontologyVersion: Int!');
    lines.push('}');
    lines.push('');

    // Root Mutation
    lines.push('type Mutation {');
    for (const cls of classes) {
      lines.push(`  create${cls.name}(input: Create${cls.name}Input!): ${cls.name}!`);
      lines.push(`  update${cls.name}(id: ID!, input: Update${cls.name}Input!): ${cls.name}!`);
      lines.push(`  delete${cls.name}(id: ID!): Boolean!`);
    }
    lines.push('}');
    lines.push('');

    // Connection type
    lines.push('type PageInfo {');
    lines.push('  hasNextPage: Boolean!');
    lines.push('  hasPreviousPage: Boolean!');
    lines.push('  currentPage: Int!');
    lines.push('  totalPages: Int!');
    lines.push('}');
    lines.push('');

    for (const cls of classes) {
      lines.push(`type ${cls.name}Connection {`);
      lines.push(`  nodes: [${cls.name}!]!`);
      lines.push(`  totalCount: Int!`);
      lines.push(`  pageInfo: PageInfo!`);
      lines.push(`}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  generateOpenApiSpec(ontology: OntologyEngine): Record<string, any> {
    const classes = Array.from(ontology.classes.values());
    const paths: Record<string, any> = {};
    const schemas: Record<string, any> = {};

    for (const cls of classes) {
      const kebab = camelToKebab(cls.name);
      const dataProps = getClassDatatypeProps(ontology, cls.id);
      const objProps = getClassObjectProps(ontology, cls.id);

      // Schema
      schemas[cls.name] = {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          ...Object.fromEntries(dataProps.map(p => [
            p.name,
            {
              type: p.datatype === 'integer' ? 'integer' : p.datatype === 'float' ? 'number' : p.datatype === 'boolean' ? 'boolean' : 'string',
              ...(p.datatype === 'datetime' ? { format: 'date-time' } : {}),
              ...(p.datatype === 'date' ? { format: 'date' } : {}),
              ...(p.unit ? { description: `Unit: ${p.unit}` } : {}),
            },
          ])),
          ...Object.fromEntries(objProps.map(p => [p.name, { type: 'string', format: 'uuid', description: `Reference to ${p.range}` }])),
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', ...dataProps.filter(p => p.required).map(p => p.name)],
      };

      const createRequired = dataProps.filter(p => p.required).map(p => p.name);

      // Paths
      // GET list
      paths[`/api/v1/ontology/entities/${kebab}`] = {
        get: {
          tags: [cls.name],
          summary: `List all ${cls.label} entities`,
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'sort', in: 'query', schema: { type: 'string' } },
            { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          ],
          responses: {
            '200': {
              description: `List of ${cls.label} entities`,
              content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: `#/components/schemas/${cls.name}` } }, total: { type: 'integer' } } } } },
            },
          },
        },
        post: {
          tags: [cls.name],
          summary: `Create a new ${cls.label}`,
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: Object.fromEntries(dataProps.map(p => [
                    p.name,
                    { type: p.datatype === 'integer' ? 'integer' : p.datatype === 'float' ? 'number' : p.datatype === 'boolean' ? 'boolean' : 'string' },
                  ])),
                  required: createRequired,
                },
              },
            },
          },
          responses: {
            '201': { description: `Created ${cls.label}`, content: { 'application/json': { schema: { $ref: `#/components/schemas/${cls.name}` } } } },
            '400': { description: 'Validation error' },
          },
        },
      };

      // GET/PUT/DELETE by id
      const basePath = `/api/v1/ontology/entities/${kebab}/{id}`;
      paths[basePath] = {
        get: {
          tags: [cls.name],
          summary: `Get ${cls.label} by ID`,
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: `${cls.label} entity`, content: { 'application/json': { schema: { $ref: `#/components/schemas/${cls.name}` } } } },
            '404': { description: 'Not found' },
          },
        },
        put: {
          tags: [cls.name],
          summary: `Update ${cls.label}`,
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: Object.fromEntries(dataProps.map(p => [
                    p.name,
                    { type: p.datatype === 'integer' ? 'integer' : p.datatype === 'float' ? 'number' : p.datatype === 'boolean' ? 'boolean' : 'string' },
                  ])),
                },
              },
            },
          },
          responses: {
            '200': { description: `Updated ${cls.label}`, content: { 'application/json': { schema: { $ref: `#/components/schemas/${cls.name}` } } } },
            '404': { description: 'Not found' },
          },
        },
        delete: {
          tags: [cls.name],
          summary: `Delete ${cls.label}`,
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Deleted', content: { 'application/json': { schema: { type: 'object', properties: { deleted: { type: 'boolean' } } } } } },
            '404': { description: 'Not found' },
          },
        },
      };
    }

    return {
      openapi: '3.0.3',
      info: {
        title: 'iSCARB Ontology API',
        description: 'Auto-generated REST API from the iSCARB academic ontology. Provides CRUD operations for all ontology entities.',
        version: `1.0.0`,
      },
      servers: [{ url: '/api/v1', description: 'API v1' }],
      security: [{ bearerAuth: [] }],
      paths,
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        schemas,
      },
    };
  }

  generateValidationRules(ontology: OntologyEngine): ValidationRules {
    const rules: ValidationRules = {};
    const classes = Array.from(ontology.classes.values());

    for (const cls of classes) {
      const dataProps = getClassDatatypeProps(ontology, cls.id);

      const makeFields = (isCreate: boolean) => {
        const fields: Record<string, { type: string; required: boolean; constraints: string[] }> = {};
        for (const p of dataProps) {
          const constraints: string[] = [];
          if (p.minLength !== undefined) constraints.push(`minLength: ${p.minLength}`);
          if (p.maxLength !== undefined) constraints.push(`maxLength: ${p.maxLength}`);
          if (p.pattern) constraints.push(`pattern: ${p.pattern}`);
          if (p.unit) constraints.push(`unit: ${p.unit}`);
          if (p.defaultValue) constraints.push(`default: ${p.defaultValue}`);
          fields[p.name] = {
            type: dtToZod(p.datatype, false),
            required: isCreate ? p.required : false,
            constraints,
          };
        }
        return fields;
      };

      rules[cls.name] = {
        create: makeFields(true),
        update: makeFields(false),
      };
    }

    return rules;
  }

  generateRbacPermissions(ontology: OntologyEngine): RbacMatrix {
    const classes = Array.from(ontology.classes.values());
    const matrix: RbacMatrix = {
      roles: [...SYSTEM_ROLES],
      entities: classes.map(c => c.name),
      permissions: {},
    };

    for (const role of SYSTEM_ROLES) {
      matrix.permissions[role] = {};
      for (const cls of classes) {
        const base = role === 'admin'
          ? { read: true, create: true, update: true, delete: true }
          : role === 'dean'
            ? { read: true, create: true, update: true, delete: false }
            : role === 'faculty'
              ? { read: true, create: false, update: false, delete: false }
              : role === 'student'
                ? { read: true, create: false, update: false, delete: false }
                : { read: true, create: false, update: false, delete: false };

        // Students can't manage other students' grades, etc.
        if (role === 'student' && ['Grade', 'Workflow', 'Permission', 'Role'].includes(cls.name)) {
          base.read = false;
        }
        // Staff can update certain entities
        if (role === 'staff' && ['Notification', 'Workflow', 'AcademicCalendar', 'Semester'].includes(cls.name)) {
          base.create = true;
          base.update = true;
        }

        matrix.permissions[role][cls.name] = base;
      }
    }

    return matrix;
  }

  generateEventSchemas(ontology: OntologyEngine): EventSchema[] {
    const events: EventSchema[] = [];
    const classes = Array.from(ontology.classes.values());

    for (const cls of classes) {
      const kebab = camelToKebab(cls.name);
      const dataProps = getClassDatatypeProps(ontology, cls.id);

      events.push({
        name: `${cls.name}.created`,
        trigger: `POST /api/v1/ontology/entities/${kebab}`,
        entity: cls.name,
        payload: Object.fromEntries(dataProps.map(p => [p.name, graphqlType(p.datatype)])),
        description: `Fired when a new ${cls.label} is created`,
      });

      events.push({
        name: `${cls.name}.updated`,
        trigger: `PUT /api/v1/ontology/entities/${kebab}/[id]`,
        entity: cls.name,
        payload: { ...Object.fromEntries(dataProps.map(p => [p.name, graphqlType(p.datatype)])), changes: 'JSON' },
        description: `Fired when a ${cls.label} is updated`,
      });

      events.push({
        name: `${cls.name}.deleted`,
        trigger: `DELETE /api/v1/ontology/entities/${kebab}/[id]`,
        entity: cls.name,
        payload: { id: 'ID!' },
        description: `Fired when a ${cls.label} is deleted`,
      });
    }

    return events;
  }
}
