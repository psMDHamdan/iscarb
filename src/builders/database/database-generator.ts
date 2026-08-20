/**
 * Database Generator — Builder #05
 *
 * Consumes SemanticModelIR → produces RelationalModelIR → SQL DDL.
 *
 * Maps ontology classes to PostgreSQL tables, datatype properties to columns,
 * object properties to foreign keys or join tables, and constraints to
 * CHECK/UNIQUE/NOT NULL constraints.
 */
import type { Builder, BuildContext } from '@/lib/semantic-model/orchestration/builder-engine';
import type { SemanticModelIR, ArtifactManifest, ArtifactEntry, CompilerDiagnostic } from '@/lib/semantic-model/ir/types';
import type { RelationalModelIR, TableIR, ColumnIR, ForeignKeyIR, JoinTableIR, IndexIR, EnumIR, CheckConstraintIR, PrimaryKeyIR } from '@/lib/semantic-model/ir/relational-ir';
import { contentHash, toSnakeCase } from '@/builders/_shared/hash';

export const DATABASE_BUILDER_ID = 'database-generator';
export const DATABASE_BUILDER_VERSION = '0.1.0';

// ────────────────────────────────────────────────────────────────────────────
// Database Builder
// ────────────────────────────────────────────────────────────────────────────

export const databaseBuilder: Builder = {
  id: DATABASE_BUILDER_ID,
  name: 'Database Generator',
  version: DATABASE_BUILDER_VERSION,
  dependsOn: [],  // Depends only on the IR being compiled (done by BuilderEngine)

  async build(ctx: BuildContext): Promise<ArtifactManifest> {
    const ir = ctx.getIR();
    const diagnostics: CompilerDiagnostic[] = [];
    const artifacts: ArtifactEntry[] = [];

    const relationalIR = generateRelationalModel(ir, diagnostics);

    // Generate SQL DDL
    const sql = generateSQLDDL(relationalIR);

    // Create artifact entries
    for (const table of relationalIR.tables) {
      artifacts.push({
        artifactType: 'database-table',
        artifactId: `db_table_${table.tableName}`,
        name: table.tableName,
        location: `sql/tables/${table.tableName}.sql`,
        checksum: contentHash(table.ddl || ''),
        status: 'created',
        metadata: {
          entity: table.entity,
          schema: table.schema,
          columns: String(table.columns.length),
        },
      });

      for (const col of table.columns) {
        artifacts.push({
          artifactType: 'database-column',
          artifactId: `db_col_${table.tableName}.${col.columnName}`,
          name: `${table.tableName}.${col.columnName}`,
          location: `sql/tables/${table.tableName}.sql`,
          checksum: contentHash(col.columnName),
          status: 'created',
          metadata: {
            sqlType: col.sqlType,
            nullable: String(col.nullable),
            property: col.property || '',
          },
        });
      }
    }

    for (const fk of relationalIR.foreignKeys) {
      artifacts.push({
        artifactType: 'database-constraint',
        artifactId: `db_fk_${fk.name}`,
        name: fk.name,
        location: `sql/constraints/${fk.name}.sql`,
        checksum: contentHash(fk.name),
        status: 'created',
        metadata: {
          fromTable: fk.fromTable,
          toTable: fk.toTable,
        },
      });
    }

    // Generate traceability links from entities to tables
    const traceLinks: Array<{
      id: string;
      sourceType: 'ontology-class' | 'ontology-property' | 'ontology-relationship';
      sourceId: string;
      targetType: 'database-table' | 'database-column' | 'database-constraint' | 'api-endpoint' | 'api-schema' | 'ui-view';
      targetId: string;
      relation: string;
      confidence: number;
      createdAt: string;
    }> = [];
    for (const entity of ir.entities) {
      if (entity.projectionMode === 'generated-greenfield' || entity.projectionMode === 'generated-authoritative') {
        const tableName = toSnakeCase(entity.name);
        traceLinks.push({
          id: `trace_db_${entity.name}`,
          sourceType: 'ontology-class',
          sourceId: entity.name,
          targetType: 'database-table',
          targetId: `db_table_${tableName}`,
          relation: 'implements',
          confidence: 1.0,
          createdAt: new Date().toISOString(),
        });

        // Link properties to columns
        for (const propRef of entity.ownedProperties) {
          const colName = toSnakeCase(propRef.name);
          traceLinks.push({
            id: `trace_db_${entity.name}_${propRef.propertyId}`,
            sourceType: 'ontology-property',
            sourceId: propRef.propertyId,
            targetType: 'database-column',
            targetId: `db_col_${tableName}.${colName}`,
            relation: 'implements',
            confidence: 1.0,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // Record warning diagnostics
    for (const diag of diagnostics) {
      ctx.addDiagnostic(diag);
    }

    // Update IR with relational model
    ctx.updateIR({
      deployment: ctx.getIR().deployment, // preserve existing
    });

    return {
      builderId: DATABASE_BUILDER_ID,
      builderVersion: DATABASE_BUILDER_VERSION,
      builtAt: new Date().toISOString(),
      ontologyVersion: ir.ontologyVersion,
      irVersion: ir.irVersion,
      artifacts,
      checksums: { sql: contentHash(sql) },
      traceLinks,
      warnings: diagnostics.filter(d => d.severity === 'warning').map(d => d.message),
    };
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Relational Model Generator
// ────────────────────────────────────────────────────────────────────────────

export function generateRelationalModel(
  ir: SemanticModelIR,
  diagnostics: CompilerDiagnostic[],
): RelationalModelIR {
  const tables: TableIR[] = [];
  const enums: EnumIR[] = [];
  const indexes: IndexIR[] = [];
  const foreignKeys: ForeignKeyIR[] = [];
  const joinTables: JoinTableIR[] = [];
  const checkConstraints: CheckConstraintIR[] = [];
  const historyTables: TableIR[] = [];

  // Phase 1: Generate entity tables
  for (const entity of ir.entities) {
    // Skip legacy-observed entities (no DB generation)
    if (entity.projectionMode === 'legacy-observed') continue;

    const tableName = toSnakeCase(entity.name);
    const columns: ColumnIR[] = [];

    // System columns
    columns.push({
      columnName: 'id',
      sqlType: 'TEXT',
      nullable: false,
      unique: true,
      isSystem: true,
      description: 'Primary key',
    });

    // Datatype property columns
    for (const propRef of entity.ownedProperties) {
      const propDef = ir.properties.find(p => p.propertyId === propRef.propertyId);
      if (!propDef) {
        // Try to find by ID or name
        const prop = ir.properties.find(
          p => p.id === propRef.propertyId || p.name === propRef.name || p.id.endsWith(`_${propRef.name}`)
        );
        if (!prop) {
          diagnostics.push({
            severity: 'warning',
            message: `Property '${propRef.name}' not found for entity '${entity.name}'`,
            source: 'database-generator',
          });
          continue;
        }
        const colName = toSnakeCase(prop.name);
        columns.push({
          property: prop.id,
          columnName: colName,
          sqlType: prop.sqlType,
          nullable: prop.sqlNullable,
          unique: prop.sqlUnique,
          defaultValue: prop.sqlDefault,
          description: prop.label,
          isSystem: false,
          ontologyDatatype: prop.datatype,
        });

        // Create indexes for indexed properties
        if (prop.sqlIndexed) {
          indexes.push({
            name: `idx_${tableName}_${colName}`,
            tableName,
            columns: [colName],
            type: 'btree',
            isVectorIndex: false,
          });
        }

        // Create CHECK constraints for pattern/range validations
        if (prop.pattern) {
          checkConstraints.push({
            name: `ck_${tableName}_${colName}_pattern`,
            tableName,
            expression: `${colName} ~ '${prop.pattern.replace(/'/g, "''")}'`,
            description: `Regex pattern: ${prop.pattern}`,
          });
        }
        continue;
      }

      const colName = toSnakeCase(propDef.name);
      columns.push({
        property: propDef.id,
        columnName: colName,
        sqlType: propDef.sqlType,
        nullable: propDef.sqlNullable,
        unique: propDef.sqlUnique,
        defaultValue: propDef.sqlDefault,
        description: propDef.label,
        isSystem: false,
        ontologyDatatype: propDef.datatype,
      });

      // Index for indexed properties
      if (propDef.sqlIndexed) {
        indexes.push({
          name: `idx_${tableName}_${colName}`,
          tableName,
          columns: [colName],
          type: 'btree',
          isVectorIndex: false,
        });
      }
    }

    // System timestamp columns
    columns.push({
      columnName: 'created_at',
      sqlType: 'TIMESTAMPTZ',
      nullable: false,
      unique: false,
      defaultValue: 'NOW()',
      isSystem: true,
      description: 'Row creation timestamp',
    });
    columns.push({
      columnName: 'updated_at',
      sqlType: 'TIMESTAMPTZ',
      nullable: false,
      unique: false,
      defaultValue: 'NOW()',
      isSystem: true,
      description: 'Row last-updated timestamp',
    });

    const primaryKey: PrimaryKeyIR = {
      columns: ['id'],
      name: `pk_${tableName}`,
    };

    tables.push({
      entity: entity.name,
      tableName,
      schema: 'public',
      label: entity.label,
      description: entity.description,
      columns,
      primaryKey,
      tableType: 'entity',
      isGenerated: entity.projectionMode !== 'legacy-mapped',
    });

    // Generate history table for generated entities
    if (entity.projectionMode === 'generated-greenfield' || entity.projectionMode === 'generated-authoritative') {
      const historyColumns: ColumnIR[] = [
        ...columns,
        {
          columnName: 'valid_from',
          sqlType: 'TIMESTAMPTZ',
          nullable: false,
          unique: false,
          isSystem: true,
          description: 'Version valid from',
        },
        {
          columnName: 'valid_to',
          sqlType: 'TIMESTAMPTZ',
          nullable: true,
          unique: false,
          isSystem: true,
          description: 'Version valid to (null = current)',
        },
      ];

      historyTables.push({
        entity: entity.name,
        tableName: `${tableName}_history`,
        schema: 'public',
        label: `${entity.label} History`,
        columns: historyColumns,
        primaryKey: { columns: ['id', 'valid_from'], name: `pk_${tableName}_history` },
        tableType: 'history',
        isGenerated: true,
      });
    }
  }

  // Phase 2: Add FK columns for one-to-many relationships
  // Each one-to-many relationship adds a FK column to the domain's table
  for (const rel of ir.relationships) {
    if (rel.cardinality === 'one-to-many') {
      const fkCol = `${toSnakeCase(rel.range)}_id`;
      const domainTable = tables.find(t => t.entity === rel.domain);
      if (domainTable) {
        // Only add if not already present
        if (!domainTable.columns.find(c => c.columnName === fkCol)) {
          domainTable.columns.push({
            columnName: fkCol,
            sqlType: 'TEXT',
            nullable: true,
            unique: false,
            isSystem: true,
            description: `Reference to ${rel.range}`,
          });
        }
      }
    }
  }

  // Phase 3: Generate join tables for many-to-many relationships
  for (const rel of ir.relationships) {
    if (rel.cardinality === 'many-to-many') {
      const joinTableName = `${toSnakeCase(rel.domain)}_${toSnakeCase(rel.name)}_${toSnakeCase(rel.range)}`;
      const leftCol = `${toSnakeCase(rel.domain)}_id`;
      const rightCol = `${toSnakeCase(rel.range)}_id`;

      joinTables.push({
        tableName: joinTableName,
        relationship: rel.name,
        leftEntity: rel.domain,
        leftColumn: leftCol,
        rightEntity: rel.range,
        rightColumn: rightCol,
        additionalColumns: [
          {
            columnName: 'created_at',
            sqlType: 'TIMESTAMPTZ',
            nullable: false,
            unique: false,
            isSystem: true,
            description: 'Relation created at',
            defaultValue: 'NOW()',
          },
        ],
      });

      // Also create FK constraints
      foreignKeys.push({
        name: `fk_${joinTableName}_${rel.domain.toLowerCase()}`,
        fromTable: joinTableName,
        fromColumns: [leftCol],
        toTable: toSnakeCase(rel.domain),
        toColumns: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      foreignKeys.push({
        name: `fk_${joinTableName}_${rel.range.toLowerCase()}`,
        fromTable: joinTableName,
        fromColumns: [rightCol],
        toTable: toSnakeCase(rel.range),
        toColumns: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

    } else if (rel.cardinality === 'one-to-many') {
      const fkCol = `${toSnakeCase(rel.range)}_id`;
      const tableName = toSnakeCase(rel.domain);

      foreignKeys.push({
        name: `fk_${tableName}_${rel.name}`,
        fromTable: tableName,
        fromColumns: [fkCol],
        toTable: toSnakeCase(rel.range),
        toColumns: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  return {
    ontologyVersion: ir.ontologyVersion,
    compiledAt: new Date().toISOString(),
    tables,
    enums,
    indexes,
    foreignKeys,
    joinTables,
    checkConstraints,
    historyTables,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// SQL DDL Generator
// ────────────────────────────────────────────────────────────────────────────

export function generateSQLDDL(relational: RelationalModelIR): string {
  const lines: string[] = [];
  lines.push('-- ================================================================');
  lines.push('-- iSCARB Generated Schema');
  lines.push(`-- Generated at: ${relational.compiledAt}`);
  lines.push(`-- Ontology Version: ${relational.ontologyVersion}`);
  lines.push('-- ================================================================');
  lines.push('');

  // Enums
  for (const enu of relational.enums) {
    lines.push(`CREATE TYPE ${enu.name} AS ENUM (${enu.values.map(v => `'${v}'`).join(', ')});`);
    lines.push('');
  }

  // Tables
  for (const table of relational.tables) {
    lines.push(`-- Table: ${table.tableName} (${table.label})`);
    lines.push(`-- ${table.description || ''}`);
    lines.push(`CREATE TABLE ${table.tableName} (`);

    const colDefs = table.columns.map(col => {
      let def = `  ${col.columnName} ${col.sqlType}`;
      if (!col.nullable) def += ' NOT NULL';
      if (col.unique) def += ' UNIQUE';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    });

    // Primary key
    colDefs.push(`  CONSTRAINT ${table.primaryKey.name} PRIMARY KEY (${table.primaryKey.columns.join(', ')})`);

    lines.push(colDefs.join(',\n'));
    lines.push(');');
    lines.push('');
  }

  // Indexes
  for (const idx of relational.indexes) {
    const unique = idx.type === 'unique' ? 'UNIQUE ' : '';
    const method = idx.isVectorIndex ? 'USING ivfflat' : '';
    lines.push(`CREATE ${unique}INDEX ${idx.name} ON ${idx.tableName} ${method}(${idx.columns.join(', ')});`);
  }
  if (relational.indexes.length > 0) lines.push('');

  // Foreign keys
  for (const fk of relational.foreignKeys) {
    lines.push(`ALTER TABLE ${fk.fromTable}`);
    lines.push(`  ADD CONSTRAINT ${fk.name}`);
    lines.push(`  FOREIGN KEY (${fk.fromColumns.join(', ')})`);
    lines.push(`  REFERENCES ${fk.toTable}(${fk.toColumns.join(', ')})`);
    lines.push(`  ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate};`);
    lines.push('');
  }

  // Check constraints
  for (const ck of relational.checkConstraints) {
    lines.push(`ALTER TABLE ${ck.tableName}`);
    lines.push(`  ADD CONSTRAINT ${ck.name}`);
    lines.push(`  CHECK (${ck.expression});`);
    lines.push('');
  }

  // Join tables DDL
  for (const jt of relational.joinTables) {
    lines.push(`-- Join table: ${jt.tableName} (${jt.relationship})`);
    lines.push(`CREATE TABLE ${jt.tableName} (`);
    lines.push(`  ${jt.leftColumn} TEXT NOT NULL REFERENCES ${toSnakeCase(jt.leftEntity)}(id) ON DELETE CASCADE,`);
    lines.push(`  ${jt.rightColumn} TEXT NOT NULL REFERENCES ${toSnakeCase(jt.rightEntity)}(id) ON DELETE CASCADE,`);
    for (const col of jt.additionalColumns) {
      let def = `  ${col.columnName} ${col.sqlType}`;
      if (!col.nullable) def += ' NOT NULL';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      lines.push(def);
    }
    lines.push(`  PRIMARY KEY (${jt.leftColumn}, ${jt.rightColumn})`);
    lines.push(');');
    lines.push('');
  }

  // History tables
  for (const ht of relational.historyTables) {
    lines.push(`-- History table: ${ht.tableName}`);
    lines.push(`CREATE TABLE ${ht.tableName} (`);
    const colDefs = ht.columns.map(col => {
      let def = `  ${col.columnName} ${col.sqlType}`;
      if (!col.nullable) def += ' NOT NULL';
      if (col.unique) def += ' UNIQUE';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    });
    colDefs.push(`  CONSTRAINT ${ht.primaryKey.name} PRIMARY KEY (${ht.primaryKey.columns.join(', ')})`);
    lines.push(colDefs.join(',\n'));
    lines.push(');');
    lines.push('');
  }

  lines.push('-- ================================================================');
  lines.push('-- End of generated schema');
  lines.push('-- ================================================================');

  return lines.join('\n');
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers are imported from @/builders/_shared/hash (toSnakeCase, contentHash)
