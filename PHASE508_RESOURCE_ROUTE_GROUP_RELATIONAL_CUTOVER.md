# Phase 508 — Resource Route Group Relational Cutover

## Objective

Move `descriptors/manifest/resourceRouteGroupDescriptor.ts` from imperative syntax-driven authority to declarative semantic relations and relation-gated descriptor construction.

## Cutover

The resource route group surface now uses:

- relation folding for route grouping;
- relation-first witnesses for resource/model/CRUD role resolution;
- relation selection for custom mutation/query partitions;
- explicit `RelationOption` presence instead of `undefined` absence;
- relation-gated CRUD classification;
- recursive relation projection for grouped routes;
- semantic option folding for primary-route and response-type resolution;
- relation equality predicates for all role/type decisions.

The host-language control constructs targeted by the scanner/lexer authority audit are absent from the closed surface.

## Research synthesis

The architecture follows the same higher-level separation seen in declarative analysis/rewrite systems: relations and rules describe semantic facts, while a separate evaluator performs recursive/fixed-point computation and a rewrite layer constructs canonical output. Soufflé models computation as relations/facts/rules; MLIR PDL/PDLL models pattern matching and rewriting as explicit IR/pattern abstractions; FlowLog adds a relational IR boundary between recursive control and logical plans.

## Validation

`npm run audit:scanner-lexer:phase508`

`closedSurfaceClean: true`

Target: `descriptors/manifest/resourceRouteGroupDescriptor.ts`

All closed-surface forbidden categories are zero.
