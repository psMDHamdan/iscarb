/**
 * Page Code Generator
 * Generates complete React page components from frontend generator outputs.
 * Uses shadcn/ui components, fetch from API, handles loading/error states.
 */
import type {
  GeneratedForm,
  GeneratedTable,
  GeneratedDashboard,
  SearchConfig,
  FormField,
} from "@/lib/ontology/frontend-generator";
import type { DatatypeProperty } from "@/lib/ontology/engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toKebab(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function tsType(datatype: string): string {
  const map: Record<string, string> = {
    string: "string",
    text: "string",
    integer: "number",
    float: "number",
    boolean: "boolean",
    date: "string",
    datetime: "string",
    json: "Record<string, any>",
  };
  return map[datatype] || "string";
}

function inputComponent(field: FormField): string {
  const val = `formData.${field.name}`;
  const setter = `updateField('${field.name}', value)`;

  switch (field.type) {
    case "textarea":
      return `<Textarea
                id="${field.name}"
                value={${val} ?? ''}
                onChange={(e) => ${setter.replace("value", "e.target.value")}}
                placeholder="${field.placeholder ?? ""}"
                ${field.required ? "required" : ""}
              />`;
    case "number":
      return `<Input
                id="${field.name}"
                type="number"
                value={${val} ?? ''}
                onChange={(e) => ${setter.replace("value", "e.target.value")}}
                placeholder="${field.placeholder ?? ""}"
                ${field.required ? "required" : ""}
              />`;
    case "date":
      return `<Input
                id="${field.name}"
                type="date"
                value={${val} ?? ''}
                onChange={(e) => ${setter.replace("value", "e.target.value")}}
                ${field.required ? "required" : ""}
              />`;
    case "datetime":
      return `<Input
                id="${field.name}"
                type="datetime-local"
                value={${val} ?? ''}
                onChange={(e) => ${setter.replace("value", "e.target.value")}}
                ${field.required ? "required" : ""}
              />`;
    case "email":
      return `<Input
                id="${field.name}"
                type="email"
                value={${val} ?? ''}
                onChange={(e) => ${setter.replace("value", "e.target.value")}}
                placeholder="${field.placeholder ?? ""}"
                ${field.required ? "required" : ""}
              />`;
    case "checkbox":
      return `<Switch
                id="${field.name}"
                checked={${val} ?? false}
                onCheckedChange={(v) => ${setter.replace("value", "v")}}
              />`;
    case "file":
      return `<Input
                id="${field.name}"
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) updateField('${field.name}', f.name);
                }}
                ${field.required ? "required" : ""}
              />`;
    default:
      return `<Input
                id="${field.name}"
                value={${val} ?? ''}
                onChange={(e) => ${setter.replace("value", "e.target.value")}}
                placeholder="${field.placeholder ?? ""}"
                ${field.required ? "required" : ""}
              />`;
  }
}

// ── Page Generators ─────────────────────────────────────────────────────────

export function generateListPage(entity: string, table: GeneratedTable): string {
  const name = capitalize(entity);
  const label = table.label || name;
  const apiPath = `/api/v1/${entity.toLowerCase()}s`;
  const adminPath = `/admin/${entity.toLowerCase()}s`;

  const colDefs = table.columns
    .map(
      (c) =>
        `    { accessorKey: '${c.accessor}', header: '${c.header}'${c.sortable ? ", enableSorting: true" : ""}${c.filterable ? ", enableColumnFilter: true" : ""} }`
    )
    .join(",\n");

  const thCells = table.columns.map((c) => `                <TableHead>${c.header}</TableHead>`).join("\n");
  const tdCells = table.columns.map((c) => `                      <TableCell>{row.${c.accessor} ?? '-'}</TableCell>`).join("\n");

  return `"use client";

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, RefreshCw, Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ${name} {
  id: string;
${table.columns.map((c) => `  ${c.accessor}?: ${tsType(c.type)};`).join("\n")}
}

export default function ${name}sPage() {
  const [items, setItems] = useState<${name}[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch('${apiPath}?' + params.toString());
      if (!res.ok) throw new Error('Failed to fetch ${label.toLowerCase()}s');
      const data = await res.json();
      setItems(data.data?.items || data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ${label.toLowerCase()}? This action cannot be undone.')) return;
    try {
      const res = await fetch(\`${apiPath}/\${id}\`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="${label}s"
        description="Manage ${label.toLowerCase()} records"
        actions={
          <Link href="${adminPath}/create">
            <Button><Plus className="mr-2 h-4 w-4" /> Add ${label}</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ${label.toLowerCase()}s..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={fetchItems}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No ${label.toLowerCase()}s found.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
${thCells}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.id}>
${tdCells}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={\`${adminPath}/\${row.id}\`}>
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          <Link href={\`${adminPath}/\${row.id}/edit\`}>
                            <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}`;
}

export function generateCreatePage(entity: string, form: GeneratedForm): string {
  const name = capitalize(entity);
  const label = form.label || name;
  const apiPath = form.submitEndpoint;
  const adminPath = `/admin/${entity.toLowerCase()}s`;

  const fieldInputs = form.fields
    .map(
      (f) => `
              <div className="space-y-2">
                <Label htmlFor="${f.name}">${f.label}${f.required ? " *" : ""}</Label>
                ${inputComponent(f)}
                ${f.helpText ? `<p className="text-xs text-muted-foreground">${f.helpText}</p>` : ""}
              </div>`
    )
    .join("\n");

  const formInit = form.fields.map((f) => `    ${f.name}: ''`).join(",\n");

  return `"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Create${name}Page() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
${formInit}
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('${apiPath}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create ${label.toLowerCase()}');
      }
      toast({ title: 'Created', description: '${label} created successfully' });
      router.push('${adminPath}');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create ${label}"
        description="Add a new ${label.toLowerCase()}"
        actions={
          <Link href="${adminPath}">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
${fieldInputs}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Create ${label}
              </Button>
              <Link href="${adminPath}">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}`;
}

export function generateEditPage(entity: string, form: GeneratedForm): string {
  const name = capitalize(entity);
  const label = form.label || name;
  const adminPath = `/admin/${entity.toLowerCase()}s`;

  const fieldInputs = form.fields
    .map(
      (f) => `
              <div className="space-y-2">
                <Label htmlFor="${f.name}">${f.label}${f.required ? " *" : ""}</Label>
                ${inputComponent(f)}
                ${f.helpText ? `<p className="text-xs text-muted-foreground">${f.helpText}</p>` : ""}
              </div>`
    )
    .join("\n");

  return `"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Edit${name}Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(\`/api/v1/${entity.toLowerCase()}s/\${id}\`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setFormData(data.data || {});
      } catch {
        toast({ title: 'Error', description: 'Failed to load ${label.toLowerCase()}', variant: 'destructive' });
        router.push('${adminPath}');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router, toast]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(\`/api/v1/${entity.toLowerCase()}s/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }
      toast({ title: 'Updated', description: '${label} updated successfully' });
      router.push('${adminPath}');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={\`Edit \${formData.name || '${label}'}\`}
        description="Update ${label.toLowerCase()} details"
        actions={
          <Link href="${adminPath}">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
${fieldInputs}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
              <Link href="${adminPath}">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}`;
}

export function generateViewPage(
  entity: string,
  properties: DatatypeProperty[]
): string {
  const name = capitalize(entity);
  const adminPath = `/admin/${entity.toLowerCase()}s`;

  const detailFields = properties
    .map(
      (p) => `
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">${p.name
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase())}</p>
                <p className="text-sm">{item.${p.name} ?? '-'}</p>
              </div>`
    )
    .join("\n");

  return `"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ${name} {
  id: string;
${properties.map((p) => `  ${p.name}?: ${tsType(p.datatype)};`).join("\n")}
}

export default function View${name}Page() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const [item, setItem] = useState<${name} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(\`/api/v1/${entity.toLowerCase()}s/\${id}\`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setItem(data.data);
      } catch {
        toast({ title: 'Error', description: '${name} not found', variant: 'destructive' });
        router.push('${adminPath}');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router, toast]);

  const handleDelete = async () => {
    if (!confirm('Delete this ${name.toLowerCase()}? This cannot be undone.')) return;
    try {
      const res = await fetch(\`/api/v1/${entity.toLowerCase()}s/\${id}\`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Deleted', description: '${name} deleted' });
        router.push('${adminPath}');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={String(item.name || item.id || '${name}')}
        description="View ${name.toLowerCase()} details"
        actions={
          <div className="flex gap-2">
            <Link href="${adminPath}">
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
            <Link href={\`${adminPath}/\${id}/edit\`}>
              <Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
${detailFields}
        </CardContent>
      </Card>
    </div>
  );
}`;
}

export function generateDashboardPage(dashboard: GeneratedDashboard): string {
  const widgetCards = dashboard.widgets
    .map(
      (w) => `
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">${w.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">--</p>
              <p className="text-xs text-muted-foreground mt-1">
                ${w.type === "metric" ? `Metrics: ${w.metrics.join(", ")}` : `Data: ${w.entity}`}
              </p>
            </CardContent>
          </Card>`
    )
    .join("\n");

  return `"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/iscarb/PageHeader';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="${dashboard.title}"
        description="Ontology-driven analytics dashboard"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
${widgetCards}
      </div>
    </div>
  );
}`;
}

export function generateSearchPage(config: SearchConfig): string {
  const entityOptions = config.entities
    .map((e) => `          { value: '${e.entity}', label: '${e.label}' }`)
    .join(",\n");

  const allFilters = config.entities.flatMap((e) =>
    e.filters.map((f) => ({ ...f, entity: e.entity, entityLabel: e.label }))
  );

  const filterInputs = allFilters
    .slice(0, 10)
    .map(
      (f) => `
              {filterType === '${f.entity}' && (
                <div className="space-y-2">
                  <Label>${f.label}</Label>
                  <Input
                    placeholder="Filter by ${f.label.toLowerCase()}..."
                    value={filters.${f.property} || ''}
                    onChange={(e) => setFilters((prev) => ({ ...prev, ${f.property}: e.target.value }))}
                  />
                </div>
              )}`
    )
    .join("\n");

  return `"use client";

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search as SearchIcon, Filter } from 'lucide-react';

interface SearchResult {
  id: string;
  entity: string;
  title: string;
  description: string;
  score: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalHits, setTotalHits] = useState(0);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (filterType) params.set('entity', filterType);
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const res = await fetch('/api/v1/search?' + params.toString());
      const data = await res.json();
      setResults(data.data?.results || []);
      setTotalHits(data.data?.total || 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, filterType, filters]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Search" description="Search across all ontology entities" />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search across all entities..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
${entityOptions}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              <SearchIcon className="mr-2 h-4 w-4" /> Search
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
${filterInputs}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{totalHits} results found</p>
          {results.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded">{r.entity}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : query && !loading ? (
        <div className="text-center py-12 text-muted-foreground">
          No results found for "{query}"
        </div>
      ) : null}
    </div>
  );
}`;
}
