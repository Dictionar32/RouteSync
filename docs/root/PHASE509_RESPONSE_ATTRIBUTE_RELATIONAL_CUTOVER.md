# RouteSync Phase 509 — Response Attribute Relational Cutover

## Objective

Move `subscanners/controller/responseAttributeScanner.ts` from imperative scanner/resolver authority to declarative semantic relations, explicit relation options, recursive relation traversal, and canonical response-contract construction.

## Research synthesis

The design is aligned with declarative compiler/analysis systems:

- MLIR PDL/PDLL represents pattern matching as a high-level IR and separates matching from rewrite.
- MLIR declarative rewrite rules describe source patterns and result patterns instead of handwritten traversal boilerplate.
- Flix treats constraints over relations as first-class and supports recursive fixed-point computation.
- egglog combines Datalog-style deduction with equality saturation.

RouteSync applies the same separation as:

`scanner evidence -> relation catalog -> candidate/option witnesses -> recursive closure -> semantic authority -> rewrite`

## Phase 509 changes

`responseAttributeScanner.ts` now uses:

- relation-gated class-file resolution;
- recursive relation traversal of fallback PHP files;
- relational grouping of observed response fields;
- relation lookup/options for declared and observed field witnesses;
- relation-gated AST value classification;
- recursive nested response-shape inference;
- relational contract merging and deduplication;
- explicit `RelationOption` absence/presence instead of undefined sentinels;
- relation-based trace projection.

The target no longer contains the closed-surface constructs audited by the scanner-frontier policy.

## Validation

`npm run audit:scanner-lexer:phase509`

Result:

`closedSurfaceClean: true`

Target `subscanners/controller/responseAttributeScanner.ts`: all forbidden categories are zero.

Target TypeScript syntax transpilation diagnostics: `0`.

Repository-wide typecheck is not claimed here; the environment has previously lacked the repository's `node` and `vitest/globals` type definitions.

## Next frontier

The largest remaining scanner/resolver frontier after Phase 509 is:

1. `subscanners/resource/resourceUpstreamExpressionCanonical.ts` — 54
2. `orchestrator/sourceAstScanner.ts` — 51
3. `subscanners/form-request/ruleCollector.ts` — 51
4. `subscanners/resource/resourceAstExpressionMapper.ts` — 51
5. `descriptors/request/controllerActionContract.ts` — 48

The next cutover should continue the same boundary: scanner evidence only, relation facts and candidates, recursive dependency closure, semantic solver authority, then rewrite.
