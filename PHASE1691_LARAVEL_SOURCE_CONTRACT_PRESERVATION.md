# Phase 1691 — Laravel Source Contract Preservation

## Trace finding

`scanSourceAsts` already scans Laravel migrations/schema, DTOs, middleware, attributes, and channels. However, `CompleteLaravelSourceModel.contracts` previously projected only models, resources, requests, responses, routes, controller actions, services, and providers. The extra source categories were present in `CompleteSourceAst` but disappeared at the canonical semantic-contract boundary.

## Change

- Extended `LaravelSemanticContractCatalog` with schema, migration, DTO, middleware, attribute, and channel contracts.
- Extended `SourceModelCatalog` to preserve those source categories.
- Projected the already-scanned AST definitions into the canonical catalog in `buildCompleteLaravelSourceModel`; no second Laravel scanner or new parser was introduced.
- Extended the canonical contract projection to retain the categories for downstream consumers.
- Added a fixture regression test against `examples/ecommerce-shop-source` for migration, schema, DTO, middleware, and attribute preservation.

## Intended flow

`Laravel source files → SourceAst evidence → CompleteSourceAst → SourceModelCatalog → LaravelSemanticContractCatalog → Manifest / downstream projections`

The change preserves source-derived semantic contracts; it does not claim that every downstream generator already consumes every new category.

## Verification

Run `node scripts/audits/audit-phase1691-laravel-source-contract-preservation.cjs`.

The repository's full TypeScript/test build could not be run in this workspace because dependencies are not installed (`node_modules` and Laravel `vendor` are absent). The global TypeScript compiler is also older than the repository's configured target and cannot validate this project configuration. Do not treat the static audit as a substitute for the full test suite.
