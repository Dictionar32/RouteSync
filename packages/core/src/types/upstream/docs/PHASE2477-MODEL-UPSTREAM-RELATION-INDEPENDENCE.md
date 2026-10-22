# Phase 2477 — Model Upstream Relation Independence

## Scope

Continue from Phase 2476's `SourceAstSyntaxParserInterface` ownership correction. This phase removes the direct `semantic/relations` dependency from three upstream model contract/operation owners: `model.ts`, `modelRelation.ts`, and `modelPrimaryKey.ts`.

## Trace and root cause

- `LaravelModelScannerInterface` remains the canonical public model scan boundary and the active scanner is exported as `laravelModelScanner: LaravelModelScannerInterface`.
- Upstream model types still imported `RelationIndex`, `relationIndexLookup`, `relationOptionFold`, and `relationProject` directly from `semantic/relations`. This made the model domain contract depend on the relation algebra rather than own its own typed model-index representation.
- `modelRelation.ts` used relation sequence helpers for filtering, projection, and exact identity matching even though its input/output contracts are already typed.
- `modelPrimaryKey.ts` used relation helpers to traverse the `Sequence<ColumnName>` ADT and assign a closed reconciliation status.

## Changes

- `ModelSemanticPropertyIndex` and `ModelSemanticRelationIndex` are now model-owned readonly tuple contracts, not aliases of `RelationIndex`.
- Model property/relation index operations now use explicit operation interfaces and exported interface-typed constants.
- `modelRelationInterfaceFrom` is explicitly typed by `ModelRelationInterfaceFactoryInterface`; matching and projection use the already-typed evidence collections.
- `reconcileModelPrimaryKey` is explicitly typed by `ModelPrimaryKeyReconciliationOperationInterface`; the existing reconciliation result variants and evidence are preserved.
- No `semantic/relations` or `semantic/foundation` import remains in those three upstream model owner files.
- The existing Laravel scanner and syntax-parser contracts are reused; no duplicate scanner interface or relocated lexer parser was added.

## Explicit remaining blockers

This phase does **not** claim that `subscanners`, `lexer`, or every relation import has been retired. At the time of Phase2477, `laravelModelScanner.ts` still imported `modelProducer` from `compiler/scanner/subscanners/modelProducer`; the initial Phase2478 artifact proposed moving that implementation, but the corrected Phase2478 artifact keeps the implementation at its original path and promotes only its operation contract upstream. The scanner still and it still depends on lexer-owned token/declaration types and parsing operations. Repository trace finds 107 files under `subscanners` and 209 files under `lexer`, with consumers across the production pipeline. Deleting either directory without migrating those consumers would break the active path.

Phase2478 closes the subscanner-owned producer boundary, but its upstream contract still imports lexer-owned AST type declarations and its implementation still delegates to `subscanners/model/modelParser.ts` and `modelCanonical.ts`. Those are unresolved ownership dependencies; do not treat this as completion of subscanners or lexer retirement.

## Verification

Run `npm run audit:phase2477-model-upstream-relation-independence` and the existing Phase 2476/2475/2465/2466 audits. Their results are recorded in the Phase 2477 delivery notes. Full typecheck, Vitest, package build, and end-to-end CLI verification must be reported separately; static ownership audits are not substitutes for those checks.

### Validation outcome

- Phase 2477 ownership audit: 11/11 passed.
- Phase 2476 syntax-parser ownership audit: 11/11 passed.
- Phase 2475 resource-field producer wiring audit: 8/8 passed.
- Phase 2465 Eloquent relation authority audit: 13/13 passed.
- Phase 2466 model relation authority audit: 11/11 passed.
- TypeScript syntax transpilation for the three changed upstream TypeScript modules: 3/3 passed.
- Full `tsc --noEmit -p tsconfig.phase87.33.narrow.json` is blocked before typechecking by missing `@types/node` and stale file entries pointing at already-removed legacy scanner files. No package build, Vitest run, or CLI end-to-end run is claimed.
