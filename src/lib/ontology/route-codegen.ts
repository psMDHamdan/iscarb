import { OntologyEngine } from './engine';
import { ApiGenerator, type GeneratedRoute } from './api-generator';

function pascalToKebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function generateParamLine(params: GeneratedRoute['params']): string {
  if (params.length === 0) return '';
  return params
    .filter(p => p.required)
    .map(p => {
      const zodType = p.type === 'number' ? 'z.coerce.number()' : 'z.string()';
      return `    ${p.name}: ${zodType}`;
    })
    .join(',\n');
}

function generateBodyValidation(body: GeneratedRoute['body']): string {
  if (body.length === 0) return 'z.object({})';
  const fields = body.map(b => {
    const zodMap: Record<string, string> = {
      string: 'z.string()',
      integer: 'z.number().int()',
      float: 'z.number()',
      boolean: 'z.boolean()',
      date: 'z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)',
      datetime: 'z.string().datetime()',
      text: 'z.string()',
      json: 'z.record(z.unknown())',
    };
    let expr = zodMap[b.type] || 'z.string()';
    if (!b.required) expr += '.optional()';
    return `    ${b.name}: ${expr}`;
  });
  return `z.object({\n${fields.join(',\n')}\n  })`;
}

export function generateRouteCode(route: GeneratedRoute, _ontology: OntologyEngine): string {
  const lines: string[] = [];
  const isDynamic = route.path.includes('[id]');
  const entityName = route.path.split('/').pop()?.replace('[id]', '').replace(/-/g, '') || 'entity';

  lines.push('import { NextRequest, NextResponse } from \'next/server\';');
  lines.push('import { guard } from \'@/lib/api-guard\';');
  lines.push('import { db } from \'@/lib/db\';');
  lines.push('import { z } from \'zod\';');
  lines.push('');

  // Validation schema
  if (route.body.length > 0) {
    lines.push(`const BodySchema = ${generateBodyValidation(route.body)};`);
    lines.push('');
  }

  if (route.params.length > 0) {
    lines.push(`const ParamsSchema = z.object({`);
    lines.push(generateParamLine(route.params));
    lines.push('});');
    lines.push('');
  }

  // Handler
  const authStr = JSON.stringify({ tier: route.auth.required ? 'write' : 'read', roles: route.auth.roles });

  if (route.method === 'GET' && !isDynamic) {
    lines.push(`export const GET = guard(`);
    lines.push(`  ${authStr},`);
    lines.push(`  async (req) => {`);
    lines.push(`    const { searchParams } = new URL(req.url);`);
    lines.push(`    const page = parseInt(searchParams.get('page') || '1');`);
    lines.push(`    const limit = parseInt(searchParams.get('limit') || '20');`);
    lines.push(`    const sort = searchParams.get('sort') || 'createdAt';`);
    lines.push(`    const order = searchParams.get('order') || 'desc';`);
    lines.push(`    const skip = (page - 1) * limit;`);
    lines.push(``);
    lines.push(`    const [items, total] = await Promise.all([`);
    lines.push(`      db.${entityName}.findMany({ skip, take: limit, orderBy: { [sort]: order } }),`);
    lines.push(`      db.${entityName}.count(),`);
    lines.push(`    ]);`);
    lines.push(``);
    lines.push(`    return NextResponse.json({ items, total, page, limit });`);
    lines.push(`  }`);
    lines.push(`);`);
  } else if (route.method === 'GET' && isDynamic) {
    lines.push(`export const GET = guard(`);
    lines.push(`  ${authStr},`);
    lines.push(`  async (req, { params }: { params: { id: string } }) => {`);
    lines.push(`    const { id } = params;`);
    lines.push(`    const item = await db.${entityName}.findUnique({ where: { id } });`);
    lines.push(`    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });`);
    lines.push(`    return NextResponse.json(item);`);
    lines.push(`  }`);
    lines.push(`);`);
  } else if (route.method === 'POST') {
    lines.push(`export const POST = guard(`);
    lines.push(`  ${authStr},`);
    lines.push(`  async (req) => {`);
    lines.push(`    const body = await req.json();`);
    if (route.body.length > 0) {
      lines.push(`    const parsed = BodySchema.safeParse(body);`);
      lines.push(`    if (!parsed.success) {`);
      lines.push(`      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });`);
      lines.push(`    }`);
    }
    lines.push(`    const item = await db.${entityName}.create({ data: ${route.body.length > 0 ? 'parsed.data' : 'body'} });`);
    lines.push(`    return NextResponse.json(item, { status: 201 });`);
    lines.push(`  }`);
    lines.push(`);`);
  } else if (route.method === 'PUT') {
    lines.push(`export const PUT = guard(`);
    lines.push(`  ${authStr},`);
    lines.push(`  async (req, { params }: { params: { id: string } }) => {`);
    lines.push(`    const { id } = params;`);
    lines.push(`    const body = await req.json();`);
    if (route.body.length > 0) {
      lines.push(`    const parsed = BodySchema.safeParse(body);`);
      lines.push(`    if (!parsed.success) {`);
      lines.push(`      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });`);
      lines.push(`    }`);
    }
    lines.push(`    const item = await db.${entityName}.update({ where: { id }, data: ${route.body.length > 0 ? 'parsed.data' : 'body'} });`);
    lines.push(`    return NextResponse.json(item);`);
    lines.push(`  }`);
    lines.push(`);`);
  } else if (route.method === 'DELETE') {
    lines.push(`export const DELETE = guard(`);
    lines.push(`  ${authStr},`);
    lines.push(`  async (req, { params }: { params: { id: string } }) => {`);
    lines.push(`    const { id } = params;`);
    lines.push(`    await db.${entityName}.delete({ where: { id } });`);
    lines.push(`    return NextResponse.json({ deleted: true });`);
    lines.push(`  }`);
    lines.push(`);`);
  }

  return lines.join('\n');
}

export function generateAllRoutes(ontology: OntologyEngine): { path: string; code: string }[] {
  const generator = new ApiGenerator();
  const routes = generator.generateRestRoutes(ontology);

  return routes.map(route => {
    const code = generateRouteCode(route, ontology);
    // Convert /api/v1/ontology/entities/foo/[id] -> api/v1/ontology/entities/foo/[id]/route.ts
    const cleanPath = route.path.replace(/^\//, '');
    return { path: `${cleanPath}/route.ts`, code };
  });
}

export async function writeRoutes(ontology: OntologyEngine, outputDir: string): Promise<number> {
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const routes = generateAllRoutes(ontology);
  let count = 0;

  for (const route of routes) {
    const fullPath = join(outputDir, route.path);
    const dir = fullPath.replace(/\/route\.ts$/, '');
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, route.code, 'utf-8');
    count++;
  }

  return count;
}
