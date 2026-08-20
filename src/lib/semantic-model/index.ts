/**
 * Semantic Model — iSCARB's ontology-driven semantic control plane.
 *
 * This module contains the core intermediate representation (IR), compiler,
 * builder orchestration framework, artifact registry, mapping registry, and
 * verification engine that together form the ontology-driven architecture.
 *
 * ## Key Components
 *
 * - **IR Types** (`ir/`): The shared data model all builders consume
 * - **Compiler** (`compiler/`): Transforms ontology → SemanticModelIR
 * - **Orchestration** (`orchestration/`): Builder interfaces and engine
 * - **Registry** (`registry/`): Artifact and mapping storage
 * - **Verification** (`verification/`): Traceability and coverage checks
 */
export type { SemanticModelIR } from './ir/types';
export type {
  EntityIR,
  RelationshipIR,
  PropertyIR,
  WorkflowIR,
  PermissionIR,
  TraceLinkIR,
  ArtifactManifest,
  ArtifactEntry,
  CompilerDiagnostic,
  ArtifactType,
  ProjectionMode,
  AuthorityMode,
  RestrictionIR,
  RequirementIR,
  ViewIR,
  ViewFieldIR,
  ApiEndpointIR,
  ApiParameterIR,
  AnalyticsIR,
  DeploymentIR,
  TestSpecIR,
  WorkflowStateIR,
  WorkflowTransitionIR,
} from './ir/types';
export type {
  RelationalModelIR,
  TableIR,
  ColumnIR,
  ForeignKeyIR,
  JoinTableIR,
  IndexIR,
  EnumIR,
  CheckConstraintIR,
} from './ir/relational-ir';
export type {
  ApiServiceIR,
  ApiResourceIR,
  ValidationRuleIR,
  PermissionPolicyIR,
  SearchConfigIR,
  GraphQLTypeIR,
} from './ir/api-ir';
export type {
  UiModelIR,
  PageIR,
  NavigationIR,
  ComponentIR,
  ThemeIR,
  PageSectionIR,
  UIFieldIR,
  UIFilterIR,
  PageActionIR,
} from './ir/ui-ir';
export type {
  TraceabilityGraph,
  ArtifactSnapshot,
  DriftReport,
  DriftChangeIR,
  VerificationResult,
  VerificationFinding,
  LayerVerificationResult,
  MissingLinkIR,
} from './ir/trace-ir';

export type {
  Builder,
} from './orchestration/builder-engine';
export {
  BuilderRegistry,
  BuilderEngine,
} from './orchestration/builder-engine';
export type {
  BuildContext,
  BuildConfig,
  BuildState,
  BuildResult,
  SemanticAnnotations,
  LegacyEntityMapping,
  LegacyFieldMapping,
  LegacyRelationshipMapping,
  EntityAnnotation,
  PropertyAnnotation,
  RelationshipAnnotation,
} from './orchestration/build-context';

export {
  SemanticCompiler,
  compileOntology,
} from './compiler/ir-builder';
export type { CompilerOptions, CompilerResult } from './compiler/ir-builder';

export {
  AnnotationProcessor,
} from './compiler/annotations';
export type { AnnotationSource } from './compiler/annotations';

export { MappingRegistry } from './registry/mapping-registry';
export type {
  MappingVerification,
  MappingCoverage,
  LegacyMappingSchema,
  MappingIssue,
} from './registry/mapping-registry';
export {
  fieldMapping,
  relationshipMapping,
  createEntityMapping,
} from './registry/mapping-registry';

export { ArtifactRegistry, getArtifactRegistry } from './registry/artifact-registry';
export type { ArtifactRecord } from './registry/artifact-registry';

export { VerificationEngine, verifySemanticModel } from './verification/engine';
export type { VerificationOptions, LayerType } from './verification/engine';

export { runStructuralRules, runDbRules } from './verification/rules';
