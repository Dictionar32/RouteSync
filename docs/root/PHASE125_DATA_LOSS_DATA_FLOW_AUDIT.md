# Phase 125 — Data-Loss / Data-Model / Data-Flow Escalation

## Goal

Move the route pipeline from syntax extraction toward an explicit data-flow contract:

`Laravel source → syntax producer → typed fact → semantic consumer`

The implementation adds `routeDataFlow.ts` with provenance-bearing facts and explicit `Presence` at the semantic boundary.

## Implemented

- Route declarations now have a `RouteDeclarationFlow` projection.
- Route targets, bindings, groups, constraints, and middleware each carry producer/model/consumer provenance.
- Route and group constraints are combined as append-only facts while retaining `source: route | group`.
- `groupController` and `groupDomain` cross the data-flow boundary as `Presence<T>` rather than semantic `undefined`.
- Resource declarations have an explicit `RouteResourceFlow` projection preserving middleware and exclusions separately.
- No parser control-flow branch is used to encode Laravel meaning in the new data-flow model.

## Navigation boundary

Token positional arithmetic remains private to `TokenCursor`; delimiter stack arithmetic remains private to delimiter navigation. No positional arithmetic was introduced by the data-flow layer.

## Audit results

- `??`: 0 in routeAst
- conditional ternary expressions: 0 in routeAst
- `switch`: 0 in routeSyntaxModel / routeDataFlow
- `while`: 0 in routeSyntaxModel / routeDataFlow
- `if`: 0 in routeSyntaxModel / routeDataFlow
- positional arithmetic outside navigation primitives: 0
- numeric `[0]` / `[1]` access in semantic route model: 0
- `indexOf` / `findIndex`: 0
- `null` literals in routeAst: 0

Regex literals containing `?` (for example Laravel optional URI parameter syntax) are source-language data and are not conditional expressions.

## External architecture alignment

Tree-sitter exposes named fields and named-node traversal so consumers do not have to encode semantic structure through child positions. Laravel 13 documents nested route-group merging and multi-action resource middleware. The RouteSync flow therefore keeps these properties as facts instead of reconstructing them through parser branches.

## Validation

The complete `routeAst` TypeScript sources transpile successfully with the available TypeScript runtime. Full repository typecheck/test is not claimed because the checkpoint environment does not contain the repository's complete dependency/type-definition set.
