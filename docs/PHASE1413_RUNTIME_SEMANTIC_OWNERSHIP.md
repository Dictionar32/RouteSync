# Phase 1413 — Runtime Semantic Ownership Migration

## Contract direction

`Laravel source evidence → upstream AST/ADT and semantic relations → reasoning authority → closed capability/operation identity/dataflow contracts → wiring → runtime executor → target projection`.

Runtime may execute an explicit contract variant, validate untrusted transport boundaries, and perform operational work. It must not infer route identity, CRUD meaning, domain intent, or dataflow semantics from raw method/path/name/payload heuristics.

## Changes

- `DomainIntentCapabilityReference` is now a closed discriminated union. Upstream materialization rejects inconsistent variant/payload combinations.
- React's intent wrapper accepts a typed generated manifest contract. It no longer inspects an `unknown` manifest object and reclassifies whether it resembles a capability. Its remaining variant branch dispatches an already-closed execution contract.
- `matchAstJudgment` now keeps the AST kind correlation in its generic signature rather than widening the visitor through `Readonly<Record<...>>`.
- `scripts/audits/audit-phase1413-runtime-semantic-ownership.cjs` records migration checks and explicit residuals.

## Critical residual

`packages/cli/src/generators/classifier/routeGrouper.ts` still calls `routeActionIdentityCapabilityAuthority.resolve`. Although the authority itself is in `core/types/upstream`, invoking it inside a CLI projection means semantic identity resolution is still owned by a downstream generator. The next migration must materialize the identity contract during upstream manifest construction and transport it through wiring; the CLI should only look up the pre-resolved identity. This residual is intentionally not hidden or marked complete.

## Build

The source workspace has no installed `node_modules/.bin/tsdown`, so the full package build cannot be verified here. The audit script is executable with Node and does not require package dependencies.
