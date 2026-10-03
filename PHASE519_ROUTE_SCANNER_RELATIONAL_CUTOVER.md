# Phase 519 — Route Scanner Relational Cutover

## Scope

The route scanner production frontier is moved from syntax/control-driven dispatch to declarative semantic relations.

Targets:

- `packages/core/src/compiler/scanner/subscanners/RouteScanner.ts`
- `packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts`

## Architecture

`route AST evidence -> route declaration relations -> controller/action witness relations -> capability/security relations -> recursive route emission -> canonical RouteSemanticFlow`

### RouteScanner

- HTTP method classification uses relation lookup.
- route-file traversal uses recursive relation gates.
- declaration traversal uses recursive relation closure.
- controller/action discovery uses option witnesses over controller registries.
- API-resource dispatch uses semantic relation classification.
- request, authentication, response, domain, and special-route construction use relation gates rather than conditional expressions.
- route method list construction uses recursive semantic sequence construction.
- route AST projection uses relation projection.
- implicit model binding resolution uses parameter relations and option witnesses.

### routeEmitter

- API-resource emission is recursive relation traversal.
- controller/action/controller-reference/closure selection is represented by option witnesses and relation gates.
- standard route emission uses relation projection plus semantic target classification.
- controller registry lookup is relation-based rather than procedural branching.

## Forbidden-surface audit

Run:

`npm run audit:scanner-lexer:phase519`

Expected result: every forbidden construct count is `0` and `closedSurfaceClean` is `true` for both target files.

## Validation

Both target files pass TypeScript `transpileModule` with zero diagnostics.

Repository-wide `tsc --noEmit` remains blocked by the existing environment's missing `node` and `vitest/globals` type definitions; no full typecheck claim is made.

## Research basis

The design continues the relation-first direction reinforced by declarative scope/constraint systems, fact closure, and pattern/rewrite systems. MLIR PDLL separates matching constraints from rewrite actions, while its PDL representation makes the match/rewrite structure explicit. Egglog combines Datalog-style relational reasoning with equality saturation, providing a useful model for the later RouteSync semantic saturation/rewrite layer.
