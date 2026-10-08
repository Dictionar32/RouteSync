# RouteSync — Phase 111 Data-Loss / Syntax-Model Audit

## Scope

Continuation from Phase 110 in the existing workspace. This phase audits whether syntax knowledge is still encoded in parser control flow, ordinal array access, or positional traversal instead of typed syntax models.

## External architecture reference

Tree-sitter exposes syntax through child/sibling navigation and named fields rather than requiring consumers to reconstruct child meaning from numeric positions. Its query syntax likewise supports field-qualified matches. This supports the RouteSync direction: syntax relations belong to a navigation/model layer. Laravel's current routing documentation documents route groups, middleware, controllers, route parameters/constraints, and resource-style controller routing; these features are represented as syntax facts before downstream semantic resolution.

## Changes

### 1. Route syntax vocabulary model

Added `routeSyntaxModel.ts` containing typed catalogs for:

- Laravel route methods
- route constraint methods
- resource registration methods
- `match([...])` target method extraction
- group `where(...)` detection

The parser no longer owns the method-name catalog as a set of ad-hoc branches.

### 2. Call argument navigation

Extended `TokenCursor` with `callArgumentSpans` and `callTrailingArgumentSpans`.

The delimiter-aware splitting remains inside syntax navigation. Nested commas are therefore not interpreted by parser loops.

### 3. Resource middleware syntax fact

Resource middleware extraction now carries an explicit syntax object containing `middleware` and optional `action`. The AST factory no longer decides that `strings[0]` is an action.

### 4. Binding regex capture

Route binding extraction now uses named regex groups (`parameter`, `key`, `optional`) instead of numeric capture indexes.

### 5. Data-loss correction during implementation

A temporary implementation widened group middleware extraction to the statement boundary. Audit caught this before checkpointing; extraction is now bounded by the actual call's `callCloseCursor`, preserving fluent-chain tokens outside the middleware call.

## Invariants after Phase 111

- `??` in `packages/core/src/compiler/scanner`: 0 occurrences.
- Numeric positional array access in `routeAst` parser/model code: 0 occurrences.
- Raw positional arithmetic outside `TokenCursor`: no traversal arithmetic found; delimiter stack arithmetic remains encapsulated in `delimiterNavigation` and token positional arithmetic remains encapsulated in `TokenCursor`.
- Syntax traversal loops remain inside navigation models (`TokenCursor`, `SyntaxRange`, `delimiterNavigation`, and the syntax model), not as parser-owned positional arithmetic.
- No stale zero-byte `routeDeclarationAst.ts.tmp` artifact remains.

## Control-flow policy

`if`/`while` were not mechanically removed. Remaining parser control flow is execution/validation/composition. Syntax knowledge such as method vocabularies, delimiter traversal, call argument boundaries, and `match([...])` extraction is represented upstream as typed model relations.

This preserves the invariant:

> upstream knowledge increases; downstream flow becomes simpler.

## Laravel alignment

Laravel's routing model includes route groups, shared middleware, controller groups, route constraints, and resource/controller routing. The parser therefore needs typed syntax facts for these constructs, while semantic interpretation should remain downstream. citeturn0search0turn0search5

Tree-sitter's documented child/sibling and named-field navigation provides the external architectural comparison: syntax consumers should use relations/fields instead of reconstructing meaning from raw child positions. citeturn0search1turn0search2turn0search4

## Validation limitation

All `routeAst/*.ts` files pass TypeScript `transpileModule` diagnostics. A full repository typecheck/test run remains environment-limited by missing repository type dependencies/tooling, so this phase does not claim a full-repo typecheck or test suite pass.
