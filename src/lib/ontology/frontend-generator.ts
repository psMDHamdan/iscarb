/**
 * Frontend Generator Engine
 * Generates forms, tables, dashboards, search configs, and navigation
 * from ontology class definitions.
 */
import type {
  OntologyClass,
  DatatypeProperty,
  ObjectProperty,
} from "@/lib/ontology/engine";

// ── Types ───────────────────────────────────────────────────────────────────

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "number"
    | "date"
    | "datetime"
    | "select"
    | "textarea"
    | "checkbox"
    | "file";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: string;
  helpText?: string;
}

export interface GeneratedForm {
  entity: string;
  label: string;
  fields: FormField[];
  validation: string;
  submitEndpoint: string;
}

export interface GeneratedTable {
  entity: string;
  label: string;
  columns: {
    header: string;
    accessor: string;
    sortable: boolean;
    filterable: boolean;
    type: string;
  }[];
  actions: string[];
  filters: string[];
  sortDefault: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: "metric" | "bar-chart" | "line-chart" | "pie-chart" | "table" | "card-grid";
  entity: string;
  metrics: string[];
  filters: string[];
  size: "sm" | "md" | "lg" | "full";
}

export interface GeneratedDashboard {
  title: string;
  widgets: DashboardWidget[];
  filterEntities: string[];
}

export interface SearchableField {
  property: string;
  label: string;
  weight: number;
}

export interface SearchFilter {
  property: string;
  label: string;
  type: "text" | "select" | "date-range" | "number-range" | "boolean";
  options?: { label: string; value: string }[];
}

export interface SearchConfig {
  entities: {
    entity: string;
    label: string;
    searchableFields: SearchableField[];
    filters: SearchFilter[];
  }[];
}

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  entity: string;
  children?: NavItem[];
}

// ── Generator ───────────────────────────────────────────────────────────────

export class FrontendGenerator {
  private classes: Map<string, OntologyClass>;
  private datatypeProps: Map<string, DatatypeProperty>;
  private objectProps: Map<string, ObjectProperty>;

  constructor(
    classes: OntologyClass[],
    datatypeProps: DatatypeProperty[],
    objectProps: ObjectProperty[]
  ) {
    this.classes = new Map(classes.map((c) => [c.id, c]));
    this.datatypeProps = new Map(datatypeProps.map((p) => [p.id, p]));
    this.objectProps = new Map(objectProps.map((p) => [p.id, p]));
  }

  /** Get all datatype properties belonging to a class (including inherited). */
  private getClassDatatypeProperties(classId: string): DatatypeProperty[] {
    const visited = new Set<string>();
    const props: DatatypeProperty[] = [];
    let current: string | undefined = classId;

    while (current && !visited.has(current)) {
      visited.add(current);
      for (const prop of this.datatypeProps.values()) {
        if (prop.domain === current) {
          props.push(prop);
        }
      }
      const cls = this.classes.get(current);
      current = cls?.parentClass;
    }
    return props;
  }

  /** Get object properties where this class is the domain. */
  private getClassObjectProperties(classId: string): ObjectProperty[] {
    return [...this.objectProps.values()].filter((p) => p.domain === classId);
  }

  /** Map ontology datatype to form field type. */
  private datatypeToFieldType(
    datatype: DatatypeProperty["datatype"]
  ): FormField["type"] {
    const map: Record<string, FormField["type"]> = {
      string: "text",
      text: "textarea",
      integer: "number",
      float: "number",
      boolean: "checkbox",
      date: "date",
      datetime: "datetime",
      json: "textarea",
    };
    return map[datatype] || "text";
  }

  /** Map ontology datatype to human-readable label. */
  private propertyToLabel(name: string): string {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }

  /** Generate Zod validation code from a property. */
  private generateFieldValidation(prop: DatatypeProperty): string {
    const validators: string[] = [];

    if (prop.required) {
      validators.push(".min(1, 'This field is required')");
    }

    switch (prop.datatype) {
      case "string": {
        if (prop.minLength)
          validators.push(`.min(${prop.minLength}, 'Minimum ${prop.minLength} characters')`);
        if (prop.maxLength)
          validators.push(`.max(${prop.maxLength}, 'Maximum ${prop.maxLength} characters')`);
        if (prop.pattern)
          validators.push(`.regex(/${prop.pattern}/, 'Invalid format')`);
        break;
      }
      case "text": {
        if (prop.minLength)
          validators.push(`.min(${prop.minLength}, 'Minimum ${prop.minLength} characters')`);
        if (prop.maxLength)
          validators.push(`.max(${prop.maxLength}, 'Maximum ${prop.maxLength} characters')`);
        break;
      }
      case "integer":
      case "float": {
        if (prop.defaultValue !== undefined) {
          validators.push(`.default(${prop.defaultValue})`);
        }
        break;
      }
      case "boolean": {
        validators.push(`.default(false)`);
        break;
      }
    }
    return validators.join("");
  }

  /** Generate a form definition from a class and its datatype properties. */
  generateForm(
    classDef: OntologyClass,
    properties?: DatatypeProperty[]
  ): GeneratedForm {
    const props = properties || this.getClassDatatypeProperties(classDef.id);
    const entityName = classDef.name;

    const fields: FormField[] = props.map((prop) => {
      const type = this.datatypeToFieldType(prop.datatype);
      const field: FormField = {
        name: prop.name,
        label: this.propertyToLabel(prop.name),
        type,
        required: prop.required,
        placeholder: `Enter ${this.propertyToLabel(prop.name).toLowerCase()}`,
        validation: this.generateFieldValidation(prop),
      };

      if (prop.datatype === "string" && prop.maxLength && prop.maxLength > 255) {
        field.type = "textarea";
      }

      if (prop.unit) {
        field.helpText = `Unit: ${prop.unit}`;
      }

      if (prop.defaultValue) {
        field.placeholder = `Default: ${prop.defaultValue}`;
      }

      return field;
    });

    const fieldSchemas = props
      .map((prop) => {
        const base =
          prop.datatype === "integer"
            ? "z.number()"
            : prop.datatype === "float"
              ? "z.number()"
              : prop.datatype === "boolean"
                ? "z.boolean()"
                : "z.string()";

        const chain = this.generateFieldValidation(prop);
        return `  ${prop.name}: ${base}${chain}`;
      })
      .join(",\n");

    const validation = `z.object({\n${fieldSchemas},\n})`;

    return {
      entity: entityName,
      label: classDef.label,
      fields,
      validation,
      submitEndpoint: `/api/v1/${entityName.toLowerCase()}s`,
    };
  }

  /** Generate a table definition from a class and its datatype properties. */
  generateTable(
    classDef: OntologyClass,
    properties?: DatatypeProperty[]
  ): GeneratedTable {
    const props = properties || this.getClassDatatypeProperties(classDef.id);
    const entityName = classDef.name;

    const columns = props.map((prop) => ({
      header: this.propertyToLabel(prop.name),
      accessor: prop.name,
      sortable: prop.datatype === "string" || prop.datatype === "integer" || prop.datatype === "float" || prop.datatype === "date" || prop.datatype === "datetime",
      filterable: prop.datatype === "string" || prop.datatype === "boolean",
      type: prop.datatype,
    }));

    const filters = props
      .filter((p) => p.datatype === "string" || p.datatype === "boolean")
      .map((p) => p.name);

    const sortDefault = props.find((p) => p.name === "createdAt")?.name
      || props[0]?.name
      || "id";

    return {
      entity: entityName,
      label: classDef.label,
      columns,
      actions: ["view", "edit", "delete"],
      filters,
      sortDefault,
    };
  }

  /** Generate dashboard widgets for a set of classes. */
  generateDashboard(classes: OntologyClass[]): GeneratedDashboard {
    const widgets: DashboardWidget[] = [];

    for (const cls of classes) {
      const props = this.getClassDatatypeProperties(cls.id);
      if (props.length === 0) continue;

      const numericProps = props.filter(
        (p) => p.datatype === "integer" || p.datatype === "float"
      );
      const dateProps = props.filter(
        (p) => p.datatype === "date" || p.datatype === "datetime"
      );
      const stringProps = props.filter((p) => p.datatype === "string");

      if (numericProps.length > 0) {
        widgets.push({
          id: `${cls.id}-summary`,
          title: `${cls.label} Overview`,
          type: "metric",
          entity: cls.id,
          metrics: numericProps.map((p) => p.name),
          filters: [],
          size: "md",
        });
      }

      if (dateProps.length > 0 && numericProps.length > 0) {
        widgets.push({
          id: `${cls.id}-timeline`,
          title: `${cls.label} Trend`,
          type: "line-chart",
          entity: cls.id,
          metrics: numericProps.slice(0, 2).map((p) => p.name),
          filters: [dateProps[0].name],
          size: "lg",
        });
      }

      if (stringProps.length > 0) {
        widgets.push({
          id: `${cls.id}-distribution`,
          title: `${cls.label} Distribution`,
          type: "pie-chart",
          entity: cls.id,
          metrics: [stringProps[0].name],
          filters: [],
          size: "sm",
        });
      }

      widgets.push({
        id: `${cls.id}-list`,
        title: `Recent ${cls.label}`,
        type: "table",
        entity: cls.id,
        metrics: props.slice(0, 4).map((p) => p.name),
        filters: [],
        size: "full",
      });
    }

    return {
      title: "Ontology Dashboard",
      widgets,
      filterEntities: classes.map((c) => c.id),
    };
  }

  /** Generate search configuration from a set of classes. */
  generateSearchConfig(classes: OntologyClass[]): SearchConfig {
    const entities = classes.map((cls) => {
      const props = this.getClassDatatypeProperties(cls.id);

      const searchableFields: SearchableField[] = props
        .filter((p) => p.datatype === "string" || p.datatype === "text")
        .map((p, i) => ({
          property: p.name,
          label: this.propertyToLabel(p.name),
          weight: i === 0 ? 10 : 5,
        }));

      const filters: SearchFilter[] = props
        .filter(
          (p) =>
            p.datatype === "string" ||
            p.datatype === "boolean" ||
            p.datatype === "date" ||
            p.datatype === "integer"
        )
        .map((p) => {
          const filter: SearchFilter = {
            property: p.name,
            label: this.propertyToLabel(p.name),
            type:
              p.datatype === "boolean"
                ? "boolean"
                : p.datatype === "date" || p.datatype === "datetime"
                  ? "date-range"
                  : p.datatype === "integer" || p.datatype === "float"
                    ? "number-range"
                    : "text",
          };
          return filter;
        });

      return {
        entity: cls.id,
        label: cls.label,
        searchableFields,
        filters,
      };
    });

    return { entities };
  }

  /** Generate sidebar navigation items from class hierarchy. */
  generateNavigation(classes: OntologyClass[]): NavItem[] {
    const iconMap: Record<string, string> = {
      Person: "Users",
      Student: "GraduationCap",
      Faculty: "BookOpen",
      Course: "BookMarked",
      Research: "FlaskConical",
      Publication: "FileText",
      Department: "Building2",
      University: "Landmark",
      Assessment: "ClipboardCheck",
      Curriculum: "LayoutList",
      Event: "Calendar",
      Career: "Briefcase",
      JobOpening: "Briefcase",
      TalentSearch: "Search",
      Facility: "Warehouse",
      Asset: "Package",
      Compliance: "Shield",
      Policy: "FileCheck",
      Governance: "Network",
    };

    const rootClasses: OntologyClass[] = [];
    const childMap = new Map<string, OntologyClass[]>();

    for (const cls of classes) {
      if (cls.parentClass && this.classes.has(cls.parentClass)) {
        const children = childMap.get(cls.parentClass) || [];
        children.push(cls);
        childMap.set(cls.parentClass, children);
      } else {
        rootClasses.push(cls);
      }
    }

    const buildNav = (cls: OntologyClass): NavItem => {
      const children = (childMap.get(cls.id) || []).map(buildNav);
      return {
        label: cls.label,
        icon: iconMap[cls.name] || "Layers",
        route: `/admin/${cls.name.toLowerCase()}s`,
        entity: cls.id,
        ...(children.length > 0 ? { children } : {}),
      };
    };

    return rootClasses.map(buildNav);
  }

  /** Generate complete React page code for a given entity and page type. */
  generatePageCode(
    entity: string,
    type: "list" | "create" | "edit" | "view"
  ): string {
    const cls = this.classes.get(entity);
    if (!cls) {
      return `// Error: Class '${entity}' not found in ontology`;
    }

    const props = this.getClassDatatypeProperties(entity);
    const form = this.generateForm(cls, props);
    const table = this.generateTable(cls, props);

    switch (type) {
      case "list":
        return this.generateListPageCode(cls, table);
      case "create":
        return this.generateCreatePageCode(cls, form);
      case "edit":
        return this.generateEditPageCode(cls, form);
      case "view":
        return this.generateViewPageCode(cls, props);
    }
  }

  // ── Code Generation ─────────────────────────────────────────────────────

  private generateListPageCode(
    cls: OntologyClass,
    table: GeneratedTable
  ): string {
    const componentName = `${cls.name}sPage`;
    const columns = table.columns
      .map(
        (col) =>
          `{ accessorKey: '${col.accessor}', header: '${col.header}'${col.sortable ? ", enableSorting: true" : ""}${col.filterable ? ", enableColumnFilter: true" : ""} }`
      )
      .join(",\n          ");

    return `"use client";

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface ${cls.name} {
  id: string;
${props.map((p) => `  ${p.name}${p.required ? "" : "?"}: ${this.tsType(p.datatype)};`).join("\n")}
}

export default function ${componentName}() {
  const [items, setItems] = useState<${cls.name}[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch('/api/v1/${cls.name.toLowerCase()}s?' + params.toString());
      if (!res.ok) throw new Error('Failed to fetch');
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
    if (!confirm('Are you sure you want to delete this ${cls.label.toLowerCase()}?')) return;
    try {
      const res = await fetch('/api/v1/${cls.name.toLowerCase()}s/' + id, { method: 'DELETE' });
      if (res.ok) fetchItems();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="${cls.label}s"
        description="Manage ${cls.label.toLowerCase()} records"
        actions={
          <Link href="/admin/${cls.name.toLowerCase()}s/create">
            <Button><Plus className="mr-2 h-4 w-4" /> Add ${cls.label}</Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ${cls.label.toLowerCase()}s..."
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
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
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
              No ${cls.label.toLowerCase()}s found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
${table.columns.map((col) => `                    <TableHead>${col.header}</TableHead>`).join("\n")}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
${table.columns.map((col) => `                      <TableCell>{item.${col.accessor} ?? '-'}</TableCell>`).join("\n")}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={\`/admin/${cls.name.toLowerCase()}s/\${item.id}\`}>
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          <Link href={\`/admin/${cls.name.toLowerCase()}s/\${item.id}/edit\`}>
                            <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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

  private generateCreatePageCode(cls: OntologyClass, form: GeneratedForm): string {
    const componentName = `Create${cls.name}Page`;
    const fieldInputs = form.fields
      .map(
        (f) => `
              <div className="space-y-2">
                <Label htmlFor="${f.name}">${f.label}${f.required ? " *" : ""}</Label>
                ${this.generateInputCode(f)}
                ${f.helpText ? `<p className="text-sm text-muted-foreground">${f.helpText}</p>` : ""}
              </div>`
      )
      .join("\n");

    const formValues = form.fields
      .map((f) => `    ${f.name}: ''`)
      .join(",\n");

    const apiBody = form.fields.map((f) => `    ${f.name}: formData.${f.name}`).join(",\n");

    return `"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ${componentName}() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
${formValues}
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('${form.submitEndpoint}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create ${cls.label.toLowerCase()}');
      }
      toast({ title: 'Success', description: '${cls.label} created successfully' });
      router.push('/admin/${cls.name.toLowerCase()}s');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create ${cls.label}"
        description="Add a new ${cls.label.toLowerCase()}"
        actions={
          <Link href="/admin/${cls.name.toLowerCase()}s">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
${fieldInputs}
            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Create ${cls.label}
              </Button>
              <Link href="/admin/${cls.name.toLowerCase()}s">
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

  private generateEditPageCode(cls: OntologyClass, form: GeneratedForm): string {
    const componentName = `Edit${cls.name}Page`;
    const fieldInputs = form.fields
      .map(
        (f) => `
              <div className="space-y-2">
                <Label htmlFor="${f.name}">${f.label}${f.required ? " *" : ""}</Label>
                ${this.generateInputCode(f)}
                ${f.helpText ? `<p className="text-sm text-muted-foreground">${f.helpText}</p>` : ""}
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

interface ${cls.name} {
  id: string;
${cls.properties?.map((p) => `  ${p.name}?: string;`).join("\n") || ""}
}

export default function ${componentName}() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch('/api/v1/${cls.name.toLowerCase()}s/' + id);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setFormData(data.data || {});
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load ${cls.label.toLowerCase()}', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/${cls.name.toLowerCase()}s/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update ${cls.label.toLowerCase()}');
      }
      toast({ title: 'Success', description: '${cls.label} updated successfully' });
      router.push('/admin/${cls.name.toLowerCase()}s');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update', variant: 'destructive' });
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
        title={\`Edit \${formData.name || '${cls.label}'}\`}
        description="Update ${cls.label.toLowerCase()} details"
        actions={
          <Link href="/admin/${cls.name.toLowerCase()}s">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
${fieldInputs}
            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
              <Link href="/admin/${cls.name.toLowerCase()}s">
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

  private generateViewPageCode(
    cls: OntologyClass,
    properties: DatatypeProperty[]
  ): string {
    const componentName = `View${cls.name}Page`;
    const detailFields = properties
      .map(
        (p) => `
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">${this.propertyToLabel(p.name)}</p>
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Pencil, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ${cls.name} {
  id: string;
${properties.map((p) => `  ${p.name}${p.required ? "" : "?"}: ${this.tsType(p.datatype)};`).join("\n")}
}

export default function ${componentName}() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const [item, setItem] = useState<${cls.name} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch('/api/v1/${cls.name.toLowerCase()}s/' + id);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setItem(data.data);
      } catch {
        toast({ title: 'Error', description: '${cls.label} not found', variant: 'destructive' });
        router.push('/admin/${cls.name.toLowerCase()}s');
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id, router, toast]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ${cls.label.toLowerCase()}?')) return;
    try {
      const res = await fetch('/api/v1/${cls.name.toLowerCase()}s/' + id, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Deleted', description: '${cls.label} deleted successfully' });
        router.push('/admin/${cls.name.toLowerCase()}s');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (!item) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name || '${cls.label}'}
        description="View ${cls.label.toLowerCase()} details"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/${cls.name.toLowerCase()}s">
              <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </Link>
            <Link href={\`/admin/${cls.name.toLowerCase()}s/\${id}/edit\`}>
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

  /** Map ontology datatype to TypeScript type. */
  private tsType(datatype: DatatypeProperty["datatype"]): string {
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

  /** Generate input JSX for a form field. */
  private generateInputCode(field: FormField): string {
    switch (field.type) {
      case "textarea":
        return `<Textarea
                  id="${field.name}"
                  value={formData.${field.name} || ''}
                  onChange={(e) => updateField('${field.name}', e.target.value)}
                  placeholder="${field.placeholder || ""}"
                  ${field.required ? "required" : ""}
                />`;
      case "number":
        return `<Input
                  id="${field.name}"
                  type="number"
                  value={formData.${field.name} || ''}
                  onChange={(e) => updateField('${field.name}', e.target.value)}
                  placeholder="${field.placeholder || ""}"
                  ${field.required ? "required" : ""}
                />`;
      case "date":
        return `<Input
                  id="${field.name}"
                  type="date"
                  value={formData.${field.name} || ''}
                  onChange={(e) => updateField('${field.name}', e.target.value)}
                  ${field.required ? "required" : ""}
                />`;
      case "datetime":
        return `<Input
                  id="${field.name}"
                  type="datetime-local"
                  value={formData.${field.name} || ''}
                  onChange={(e) => updateField('${field.name}', e.target.value)}
                  ${field.required ? "required" : ""}
                />`;
      case "email":
        return `<Input
                  id="${field.name}"
                  type="email"
                  value={formData.${field.name} || ''}
                  onChange={(e) => updateField('${field.name}', e.target.value)}
                  placeholder="${field.placeholder || ""}"
                  ${field.required ? "required" : ""}
                />`;
      case "checkbox":
        return `<Switch
                  id="${field.name}"
                  checked={formData.${field.name} || false}
                  onCheckedChange={(val) => updateField('${field.name}', val)}
                />`;
      case "file":
        return `<Input
                  id="${field.name}"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) updateField('${field.name}', file.name);
                  }}
                  ${field.required ? "required" : ""}
                />`;
      default:
        return `<Input
                  id="${field.name}"
                  value={formData.${field.name} || ''}
                  onChange={(e) => updateField('${field.name}', e.target.value)}
                  placeholder="${field.placeholder || ""}"
                  ${field.required ? "required" : ""}
                />`;
    }
  }
}
