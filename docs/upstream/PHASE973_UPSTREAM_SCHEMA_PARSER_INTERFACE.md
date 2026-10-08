# Phase 973 — Upstream Schema Parser Interface Closure

## Scope

This phase closes the migration/schema upstream boundary after tracing the Laravel ecommerce fixture, manifest/dataflow boundary, and the existing Eloquent/schema reconciliation.

## Changes

- Added `SchemaInterface` as the canonical upstream semantic interface over the closed cumulative `SchemaAst`.
- `SchemaProducer` now returns `SchemaInterface`.
- Model schema consumers (`ModelScanner`, `modelProducer`, `modelParser`, `columnInferrer`, and `modelSemanticDefinition`) consume `SchemaInterface` rather than directly naming the concrete schema AST contract.
- Fixed `foreignId(...)->constrained('table')` extraction so the explicit table is taken from the argument following `constrained`, not from the method token itself.
- Fixed chained `cascadeOnDelete`, `nullOnDelete`, and `restrictOnDelete` detection so actions are resolved anywhere in the relation chain.
- Fixed explicit `foreign(...)->references(...)->on(...)` extraction to read the argument following each relation method.
- Kept `ManifestDataflowSeedSurface` input-only. Manifest does not own closure, path, or fixed-point reasoning.
- Kept `SemanticDataflowInterface` as the sole dataflow judgment interface.

## Laravel alignment

Laravel's `foreignId()->constrained()` uses convention when no table is supplied and accepts an explicit table when supplied. Route model binding remains a separate semantic mechanism (implicit, explicit, custom-key, and scoped binding) and is not inferred from schema foreign keys.

## Regression audit

`scripts/audits/audit-phase973-upstream-schema-parser-interface.cjs` verifies:

- schema semantic interface and producer return type;
- explicit `constrained('...')` target extraction;
- chained delete action extraction;
- explicit `foreign()->references()->on()` extraction;
- model consumption through `SchemaInterface`;
- manifest remains seed-only;
- dataflow interface retains fixed-point ownership;
- ecommerce fixture contains both explicit and convention-based constraints.

Phase 971 and Phase 972 audits remain clean after the interface elevation.
