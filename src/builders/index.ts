/**
 * Builders — iSCARB's ontology-driven generator suite (16 builders).
 *
 * Each builder consumes the SemanticModelIR and produces artifacts.
 * They are registered with the BuilderEngine and executed in dependency order.
 */
export { databaseBuilder, DATABASE_BUILDER_ID, generateRelationalModel, generateSQLDDL } from './database/database-generator';
export { apiBuilder, API_BUILDER_ID, generateApiService } from './api/api-generator';
export { frontendBuilder, FRONTEND_BUILDER_ID, generateUiModel } from './frontend/frontend-generator';
