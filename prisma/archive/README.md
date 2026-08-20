# Prisma archive (not applied by migrate)

This folder holds SQL that must **not** live under `prisma/migrations/`. Prisma only applies subdirectories that contain `migration.sql`. A loose `.sql` file in `migrations/` is ignored by `migrate deploy` but looks as if it were part of the history.

## `assessment_platform_v2_comprehensive.sql`

- **What it was:** A 2026-07-14 design dump (snake_case tables: `knowledge_sources`, `knowledge_chunks`, `question_bank`, `competency_framework`, `user_roles`, `audit_logs`, `ai_cost_tracking`, K2Think queue, etc.). Companion unused models live in `prisma/prisma_schema_additions.prisma` (not the live schema).
- **Did Prisma ever apply it?** No. It was never a migration directory.
- **Is anything in it still needed?** No additional migration. The live `schema.prisma` already has PascalCase equivalents that real migrations created (`0_init`, `20260714000000_enable_pgvector`, `20260809180000_add_employability_bank_question`, and later lecture/assessment migrations): `KnowledgeSource`, `CompetencyFramework`, `Role` / `Permission` / `UserRole`, `AuditLog`, `EmployabilityBankQuestion`, plus pgvector via `CREATE EXTENSION vector`. Shapes differ from this prototype; applying the prototype SQL on a Prisma-managed DB would create extra tables Prisma does not model and would fail zero-drift.
- **What we did:** Moved the file here on 2026-08-14 so `prisma/migrations/` contains only numbered migration directories and `migration_lock.toml`.
