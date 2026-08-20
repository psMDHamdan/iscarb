/**
 * Frontend Generator — Builder #09
 *
 * Consumes SemanticModelIR → produces UI page metadata (UiModelIR).
 *
 * This generator produces metadata consumed by a runtime schema-driven UI renderer.
 * It does NOT generate actual React component files — the renderer uses this
 * metadata to render pages dynamically. This approach keeps the UI synchronized
 * with ontology changes without code generation churn.
 */
import type { Builder, BuildContext } from '@/lib/semantic-model/orchestration/builder-engine';
import type { SemanticModelIR, ArtifactManifest, ArtifactEntry, CompilerDiagnostic, TraceLinkIR } from '@/lib/semantic-model/ir/types';
import type { UiModelIR, NavigationIR, PageSectionIR, UIFieldIR, UIFilterIR, PageActionIR, ComponentIR } from '@/lib/semantic-model/ir/ui-ir';
import { contentHash } from '@/builders/_shared/hash';

export const FRONTEND_BUILDER_ID = 'frontend-generator';
export const FRONTEND_BUILDER_VERSION = '0.1.0';

// ────────────────────────────────────────────────────────────────────────────
// Frontend Builder
// ────────────────────────────────────────────────────────────────────────────

export const frontendBuilder: Builder = {
  id: FRONTEND_BUILDER_ID,
  name: 'Frontend Generator',
  version: FRONTEND_BUILDER_VERSION,
  dependsOn: ['api-generator'], // UI depends on API structure

  async build(ctx: BuildContext): Promise<ArtifactManifest> {
    const ir = ctx.getIR();
    const diagnostics: CompilerDiagnostic[] = [];
    const artifacts: ArtifactEntry[] = [];

    const uiModel = generateUiModel(ir, diagnostics);

    // Create artifact entries
    for (const page of uiModel.pages) {
      artifacts.push({
        artifactType: 'ui-view',
        artifactId: `ui_page_${page.id}`,
        name: page.label,
        location: `ui/pages/${page.id}.json`,
        checksum: contentHash(JSON.stringify(page)),
        status: 'created',
        metadata: {
          type: page.type,
          entity: page.entity,
          route: page.route,
          sections: String(page.sections.length),
        },
      });
    }

    for (const nav of uiModel.navigation) {
      artifacts.push({
        artifactType: 'ui-view',
        artifactId: `ui_nav_${nav.id}`,
        name: nav.label,
        location: `ui/navigation/${nav.id}.json`,
        checksum: contentHash(nav.label),
        status: 'created',
        metadata: {
          route: nav.route || '',
          children: String(nav.children.length),
        },
      });
    }

    // Generate traceability links
    const traceLinks: TraceLinkIR[] = [];
    for (const entity of ir.entities) {
      if (entity.projectionMode === 'generated-greenfield' || entity.projectionMode === 'generated-authoritative') {
        traceLinks.push({
          id: `trace_ui_${entity.name}`,
          sourceType: 'ontology-class',
          sourceId: entity.name,
          targetType: 'ui-view',
          targetId: `ui_page_${entity.name.toLowerCase()}_list`,
          relation: 'implements',
          confidence: 1.0,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Record diagnostics
    for (const diag of diagnostics) {
      ctx.addDiagnostic(diag);
    }

    return {
      builderId: FRONTEND_BUILDER_ID,
      builderVersion: FRONTEND_BUILDER_VERSION,
      builtAt: new Date().toISOString(),
      ontologyVersion: ir.ontologyVersion,
      irVersion: ir.irVersion,
      artifacts,
      checksums: { uiModel: contentHash(JSON.stringify(uiModel)) },
      traceLinks,
      warnings: diagnostics.filter(d => d.severity === 'warning').map(d => d.message),
    };
  },
};

// ────────────────────────────────────────────────────────────────────────────
// UI Model Generator
// ────────────────────────────────────────────────────────────────────────────

export function generateUiModel(
  ir: SemanticModelIR,
  diagnostics: CompilerDiagnostic[],
): UiModelIR {
  const pages: PageIR[] = [];
  const navigation: NavigationIR[] = [];
  const components: ComponentIR[] = [];

  // Generate pages for each entity
  for (const entity of ir.entities) {
    if (entity.projectionMode === 'legacy-observed') continue;

    // List page
    const listPage = generateListPage(entity, ir);
    pages.push(listPage);

    // Detail page
    const detailPage = generateDetailPage(entity, ir);
    pages.push(detailPage);

    // Form (create/edit) page
    const formPage = generateFormPage(entity, ir);
    pages.push(formPage);
  }

  // Generate navigation
  navigation.push(...generateNavigation(ir));

  // Shared components
  components.push(...generateComponents(ir));

  return {
    ontologyVersion: ir.ontologyVersion,
    compiledAt: new Date().toISOString(),
    pages,
    navigation,
    components,
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#4f46e5',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      darkMode: true,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Page Generators
// ────────────────────────────────────────────────────────────────────────────

function generateListPage(entity: EntityIR, ir: SemanticModelIR): PageIR {
  const entityLower = entity.name.toLowerCase();
  const columns = entity.ownedProperties
    .filter(r => r.name !== 'id')
    .slice(0, 6); // Show first 6 visible properties

  // Build filterable fields
  const filters: UIFilterIR[] = entity.ownedProperties
    .filter(r => {
      const prop = ir.properties.find(p => p.name === r.name);
      return prop?.filterable;
    })
    .map(r => ({
      property: r.name,
      label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
      type: 'text' as const,
    }));

  const fields: UIFieldIR[] = columns.map((r, i) => ({
    property: r.name,
    label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
    visible: true,
    readOnly: true,
    required: r.required,
    widget: determineWidget(r, ir),
    order: i,
    gridWidth: i === 0 ? 3 : 2,
  }));

  const sections: PageSectionIR[] = [
    {
      id: `${entityLower}_list_table`,
      type: 'table',
      label: `All ${entity.label}s`,
      fields,
      filters: filters.length > 0 ? filters : undefined,
      sort: {
        defaultField: 'createdAt',
        defaultDirection: 'desc',
        allowedFields: columns.map(r => r.name),
      },
    },
  ];

  const actions: PageActionIR[] = [
    {
      id: `${entityLower}_create`,
      label: `New ${entity.label}`,
      type: 'create',
      handler: 'create',
      variant: 'primary',
    },
  ];

  return {
    id: `${entityLower}_list`,
    name: `${entity.label}List`,
    label: entity.label,
    type: 'list',
    entity: entity.name,
    route: `/generated/${entityLower}s`,
    layout: { type: 'single-column', maxWidth: 'xl' },
    sections,
    actions,
    requiredPermissions: ['admin', 'faculty'],
    relatedPages: [`${entityLower}_detail`, `${entityLower}_form`],
    isGenerated: true,
    annotations: entity.annotations,
  };
}

function generateDetailPage(entity: EntityIR, ir: SemanticModelIR): PageIR {
  const entityLower = entity.name.toLowerCase();

  const fields: UIFieldIR[] = entity.ownedProperties
    .filter(r => r.name !== 'id')
    .map((r, i) => ({
      property: r.name,
      label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
      visible: true,
      readOnly: true,
      required: r.required,
      widget: determineWidget(r, ir),
      order: i,
      gridWidth: 6,
    }));

  const sections: PageSectionIR[] = [
    {
      id: `${entityLower}_detail_info`,
      type: 'detail',
      label: `${entity.label} Information`,
      fields,
    },
    {
      id: `${entityLower}_detail_related`,
      type: 'related-entities',
      label: 'Related Entities',
      fields: entity.outgoingRelationships.map((r, i) => ({
        property: r.name,
        label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
        visible: true,
        readOnly: true,
        required: false,
        widget: 'relation-list',
        order: i,
      })),
    },
    {
      id: `${entityLower}_detail_activity`,
      type: 'activity-log',
      label: 'Activity Log',
      fields: [],
    },
  ];

  const actions: PageActionIR[] = [
    {
      id: `${entityLower}_edit`,
      label: 'Edit',
      type: 'edit',
      handler: 'edit',
      variant: 'secondary',
    },
    {
      id: `${entityLower}_delete`,
      label: 'Delete',
      type: 'delete',
      handler: 'delete',
      variant: 'danger',
      confirm: true,
    },
  ];

  return {
    id: `${entityLower}_detail`,
    name: `${entity.label}Detail`,
    label: entity.label,
    type: 'detail',
    entity: entity.name,
    route: `/generated/${entityLower}s/:id`,
    layout: { type: 'two-column', maxWidth: 'xl' },
    sections,
    actions,
    requiredPermissions: ['admin', 'faculty'],
    relatedPages: [`${entityLower}_list`, `${entityLower}_form`],
    isGenerated: true,
    annotations: entity.annotations,
  };
}

function generateFormPage(entity: EntityIR, ir: SemanticModelIR): PageIR {
  const entityLower = entity.name.toLowerCase();

  const fields: UIFieldIR[] = entity.ownedProperties
    .filter(r => r.name !== 'id')
    .map((r, i) => {
      const propDef = ir.properties.find(
        p => p.propertyId === r.propertyId || p.name === r.name
      );
      return {
        property: r.name,
        label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
        visible: true,
        readOnly: propDef?.uiReadOnly ?? false,
        required: r.required,
        widget: propDef?.uiWidget as any || determineWidget(r, ir),
        order: i,
        gridWidth: 6,
        placeholder: `Enter ${r.name}`,
        helpText: propDef?.label,
        validation: propDef ? {
          minLength: propDef.minLength,
          maxLength: propDef.maxLength,
          pattern: propDef.pattern,
        } : undefined,
        visibleWhen: r.required ? undefined : {
          field: 'id',
          operator: 'not-equals' as any,
          value: 'new',
        },
      };
    });

  const sections: PageSectionIR[] = [
    {
      id: `${entityLower}_form_main`,
      type: 'form',
      label: `${entity.label} Details`,
      fields,
    },
  ];

  const actions: PageActionIR[] = [
    {
      id: `${entityLower}_save`,
      label: 'Save',
      type: 'custom',
      handler: 'save',
      variant: 'primary',
    },
    {
      id: `${entityLower}_cancel`,
      label: 'Cancel',
      type: 'custom',
      handler: 'cancel',
      variant: 'ghost',
    },
  ];

  return {
    id: `${entityLower}_form`,
    name: `${entity.label}Form`,
    label: `Create ${entity.label}`,
    type: 'form',
    entity: entity.name,
    route: `/generated/${entityLower}s/new`,
    layout: { type: 'single-column', maxWidth: 'md' },
    sections,
    actions,
    requiredPermissions: ['admin', 'faculty'],
    relatedPages: [`${entityLower}_list`, `${entityLower}_detail`],
    isGenerated: true,
    annotations: entity.annotations,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Navigation Generator
// ────────────────────────────────────────────────────────────────────────────

function generateNavigation(ir: SemanticModelIR): NavigationIR[] {
  const nav: NavigationIR[] = [];
  let order = 0;

  for (const entity of ir.entities) {
    if (entity.projectionMode === 'legacy-observed') continue;
    order++;

    nav.push({
      id: `nav_${entity.name.toLowerCase()}`,
      label: entity.label,
      route: `/generated/${entity.name.toLowerCase()}s`,
      requiredPermissions: ['admin', 'faculty'],
      children: [
        {
          id: `nav_${entity.name.toLowerCase()}_list`,
          label: `All ${entity.label}s`,
          route: `/generated/${entity.name.toLowerCase()}s`,
          requiredPermissions: ['admin', 'faculty'],
          children: [],
          order: 1,
          entity: entity.name,
        },
        {
          id: `nav_${entity.name.toLowerCase()}_new`,
          label: `New ${entity.label}`,
          route: `/generated/${entity.name.toLowerCase()}s/new`,
          requiredPermissions: ['admin', 'faculty'],
          children: [],
          order: 2,
          entity: entity.name,
        },
      ],
      order,
      entity: entity.name,
    });
  }

  return nav;
}

// ────────────────────────────────────────────────────────────────────────────
// Component Generator
// ────────────────────────────────────────────────────────────────────────────

function generateComponents(ir: SemanticModelIR): ComponentIR[] {
  const components: ComponentIR[] = [];

  for (const entity of ir.entities) {
    if (entity.projectionMode === 'legacy-observed') continue;

    components.push({
      id: `comp_${entity.name.toLowerCase()}_card`,
      name: `${entity.label}Card`,
      type: 'entity-card',
      entity: entity.name,
      configuration: {
        displayFields: entity.ownedProperties.slice(0, 3).map(r => r.name),
        linkToDetail: true,
      },
    });

    components.push({
      id: `comp_${entity.name.toLowerCase()}_search`,
      name: `${entity.label}Search`,
      type: 'search-bar',
      entity: entity.name,
      configuration: {
        searchFields: entity.ownedProperties.filter(r => {
          const p = ir.properties.find(p => p.propertyId === r.propertyId || p.name === r.name);
          return p?.searchable;
        }).map(r => r.name),
      },
    });
  }

  return components;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function determineWidget(propRef: { name: string; propertyId: string }, ir: SemanticModelIR): string {
  const propDef = ir.properties.find(
    p => p.propertyId === propRef.propertyId || p.name === propRef.name
  );
  if (propDef?.uiWidget) return propDef.uiWidget;

  const widgetMap: Record<string, string> = {
    string: 'text',
    integer: 'number',
    float: 'number',
    boolean: 'checkbox',
    date: 'date',
    datetime: 'datetime',
    text: 'textarea',
    json: 'json-editor',
  };

  return propDef ? (widgetMap[propDef.datatype] || 'text') : 'text';
}

// hashContent is imported from @/builders/_shared/hash
