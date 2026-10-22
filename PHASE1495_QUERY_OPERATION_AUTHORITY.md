# Phase 1495 — Query Operation Authority

## Goal

Move model-static query operation decisions from scanner-local catalogs into the upstream semantic authority, so scanner code consumes a resolved operation contract rather than independently mapping method names to AST operations.

## Changes

- Added `ResolvedModelStaticOperation` and `resolveModelStaticOperation` to the upstream semantic interface.
- Made `resolveModelOrigin` a projection of the authoritative operation judgment, removing the duplicate model-origin static vocabulary.
- Implemented upstream resolution for `all`, `query`, `select`, `where`, `whereKey`, `with`, `orderBy`, `orderByAsc`, `orderByDesc`, `findOrFail`, `create`, `updateOrCreate`, and `firstOrCreate`.
- Added validation for required arguments, relation paths, ordering direction, and supported comparison operators.
- Removed `modelStaticOperationCatalog` and its resolver type from `queryEvidenceProducer.ts`.
- Reduced `modelStaticOperationFromExpression` to a call to upstream authority plus AST projection.
- Added regression coverage for resolved and malformed static ordering operations.
- Added an architecture audit: `npm run audit:phase1495-query-operation-authority`.

## Boundary still open

The scanner's `RelationOption<QueryOperationAst>` projection still maps every non-resolved judgment to `none`; therefore malformed diagnostics are not yet carried into query AST. That compatibility boundary is a follow-up migration. This phase closes the duplicate operation catalog but does not claim the whole query pipeline is fully judgment-preserving.

## Verification

- Syntax transpilation with the available TypeScript transpiler: passed for edited TypeScript files.
- Phase 1495 architecture audit: run separately and expected to confirm the scanner catalog is absent.
- Full build and Vitest tests were not run because workspace dependencies (`tsdown`, `vitest`, project TypeScript 7 toolchain) are not installed in this environment.
