# Phase 971 — Upstream Migration Schema Interface Closure

Phase 971 repairs the migration/schema boundary identified after Phase 970.

## Migration operation semantics

`migrationProducer.ts` now distinguishes `Schema::create(...)` from `Schema::table(...)`:

- `Schema::create` produces `MigrationOperation.kind = create_table`.
- `Schema::table` produces `MigrationOperation.kind = alter_table`.

The existing `schemaProducer` is the cumulative schema authority. `alter_table` additions, indexes, and foreign keys are folded into the existing `TableState` instead of being treated as a second table creation.

## Model upstream boundary

Models no longer consume `MigrationAst[]` for schema resolution. The canonical path is now:

```text
MigrationAst[]
  -> SchemaProducer
  -> SchemaAst
  -> SchemaTable
  -> ModelSemanticDefinition
```

`columnInferrer.ts` is now a `SchemaAst` lookup boundary. It does not interpret migration operations itself.

`modelProducer.ts`, `ModelScanner.ts`, and `sourceAstScanner.ts` were rewired to pass the produced `SchemaAst` downstream.

## Dead compatibility surface

The unused `model/migrationScanner.ts` and its `scanMigrations` exports were removed. There are no remaining production consumers that expose raw migration scanning through the model scanner.

## Fixture proof

The ecommerce fixture contains both:

- `create_order_details_table.php` with `Schema::create('order_details', ...)`
- `add_absurd_fields_to_order_details_table.php` with `Schema::table('order_details', ...)`

The latter adds `banana`, `potato`, and `flying_dog`. These operations now enter the cumulative schema as an alteration of the existing `order_details` table.

## Dataflow boundary preserved

Phase 971 does not introduce a second dataflow solver or move dataflow computation into migration/schema surfaces. The Phase 970 `SemanticDataflowInput -> SemanticDataflowJudgment -> SemanticDataflowInterface` authority remains unchanged.

## External correspondence

Laravel documents `Schema::create` as table creation and `Schema::table` as updating an existing table. CodeQL separates source/sink configuration, generic dataflow computation, and path graph presentation; MLIR similarly uses interfaces to decouple analysis from concrete operation implementations. RouteSync therefore keeps schema accumulation upstream and dataflow solving downstream.

## Validation

- `audit-phase971-upstream-migration-schema-interface.cjs`: clean
- `audit-phase964-upstream-dataflow-interface.cjs`: clean
- `audit-phase965-route-parameter-dataflow.cjs`: clean
- `audit-phase966-controller-dataflow-interface.cjs`: clean
- `audit-phase970-manifest-dataflow-closure.cjs`: clean
- TypeScript compile remains blocked by incomplete dependency installation in the extracted workspace (`@types/node` and `vitest/globals` are absent); no source-level compile result is claimed.
