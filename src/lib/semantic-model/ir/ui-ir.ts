/**
 * UI IR — the frontend presentation projection of the semantic model.
 *
 * Describes generated pages, forms, lists, dashboards, and navigation.
 * Can be consumed either by a runtime metadata-driven renderer or a code generator.
 */
import type { ViewType } from './types';

// ────────────────────────────────────────────────────────────────────────────
// Top-level UI model
// ────────────────────────────────────────────────────────────────────────────

export interface UiModelIR {
  /** Source ontology version */
  ontologyVersion: number;
  compiledAt: string;

  /** All pages/views */
  pages: PageIR[];

  /** Navigation structure */
  navigation: NavigationIR[];

  /** Shared components (reusable across pages) */
  components: ComponentIR[];

  /** Theme / branding */
  theme?: ThemeIR;
}

// ────────────────────────────────────────────────────────────────────────────
// Page IR
// ────────────────────────────────────────────────────────────────────────────

export interface PageIR {
  id: string;
  name: string;
  label: string;
  labelAr?: string;
  type: ViewType;
  /** Entity this page is for */
  entity: string;
  /** Route path */
  route: string;

  /** Layout configuration */
  layout: PageLayoutIR;

  /** Sections within the page */
  sections: PageSectionIR[];

  /** Actions available on this page (buttons, links) */
  actions: PageActionIR[];

  /** Required permissions */
  requiredPermissions: string[];

  /** Related pages */
  relatedPages: string[];

  /** Whether this page is auto-generated */
  isGenerated: boolean;

  annotations: Record<string, string>;
}

export interface PageLayoutIR {
  type: 'single-column' | 'two-column' | 'sidebar' | 'tabs' | 'dashboard-grid';
  /** Max width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface PageSectionIR {
  id: string;
  type: 'table' | 'form' | 'detail' | 'card-grid' | 'chart' | 'timeline' | 'graph' | 'related-entities' | 'activity-log';
  label: string;
  /** Fields to display in this section */
  fields: UIFieldIR[];
  /** Filters for this section */
  filters?: UIFilterIR[];
  /** Sort configuration */
  sort?: UISortIR;
}

export interface UIFieldIR {
  /** Ontology property name */
  property: string;
  label: string;
  labelAr?: string;
  visible: boolean;
  /** Widget type for this field */
  widget: 'text' | 'textarea' | 'number' | 'select' | 'multi-select' | 'date' | 'datetime' | 'checkbox'
    | 'toggle' | 'email' | 'url' | 'phone' | 'file' | 'image' | 'json-editor' | 'rich-text'
    | 'rating' | 'slider' | 'color' | 'relation-select' | 'relation-list';
  /** Whether the field is read-only */
  readOnly: boolean;
  /** Whether the field is required in forms */
  required: boolean;
  /** Placeholder hint */
  placeholder?: string;
  /** Help text */
  helpText?: string;
  /** Validation hints for the UI */
  validation?: UIFieldValidationIR;
  /** Order in the form/list */
  order: number;
  /** Width in grid columns (1-12) */
  gridWidth?: number;
  /** Conditional visibility expression */
  visibleWhen?: ConditionalExpressionIR;
}

export interface UIFieldValidationIR {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  customMessage?: string;
}

export interface ConditionalExpressionIR {
  field: string;
  operator: 'equals' | 'not-equals' | 'in' | 'greater-than' | 'less-than' | 'contains';
  value: unknown;
}

export interface UIFilterIR {
  property: string;
  label: string;
  type: 'text' | 'select' | 'multi-select' | 'date-range' | 'number-range' | 'boolean';
  /** Options for select filters */
  options?: Array<{ value: string; label: string }>;
}

export interface UISortIR {
  defaultField: string;
  defaultDirection: 'asc' | 'desc';
  allowedFields: string[];
}

export interface PageActionIR {
  id: string;
  label: string;
  labelAr?: string;
  icon?: string;
  type: 'create' | 'edit' | 'delete' | 'view' | 'custom' | 'workflow-transition';
  /** Action handler (built-in CRUD or custom) */
  handler: string;
  /** Confirmation required */
  confirm?: boolean;
  /** Primary/secondary/danger styling */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

// ────────────────────────────────────────────────────────────────────────────
// Navigation IR
// ────────────────────────────────────────────────────────────────────────────

export interface NavigationIR {
  id: string;
  label: string;
  labelAr?: string;
  icon?: string;
  route?: string;
  /** Required permissions */
  requiredPermissions: string[];
  /** Child navigation items */
  children: NavigationIR[];
  order: number;
  /** Entity this nav item is for */
  entity?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Shared Component IR
// ────────────────────────────────────────────────────────────────────────────

export interface ComponentIR {
  id: string;
  name: string;
  type: 'entity-card' | 'relation-panel' | 'search-bar' | 'activity-feed' | 'stats-widget'
    | 'timeline' | 'graph-viewer' | 'audit-log' | 'workflow-status';
  /** Entity this component is for */
  entity?: string;
  configuration: Record<string, unknown>;
}

// ────────────────────────────────────────────────────────────────────────────
// Theme IR
// ────────────────────────────────────────────────────────────────────────────

export interface ThemeIR {
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
  borderRadius?: string;
  /** Dark mode support */
  darkMode: boolean;
}
