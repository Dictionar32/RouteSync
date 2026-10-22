# Phase 2309 — Constructor Inventory Closure

## Objective

Evolve the existing upstream constructor-selection contract so it consumes an explicit closed method-declaration inventory. Do not add a second selector authority and do not interpret a parser-blocked inventory as a missing constructor.

## Changes

- `PhpClassConstructorSelectionAuthorityInterface` is contract version 2 and accepts `PhpClassMethodDeclarationInventory<TMethod>` as its only selection input.
- The upstream authority passes a blocked inventory through as `php_class_constructor_selection_blocked`; selected/missing/ambiguous judgments are only produced for a complete inventory.
- `ControllerDeclarationAst` now carries `ControllerMethodDeclarationInventory`. The parser emits `complete` when every discovered named-function candidate is parsed and `blocked` when any candidate is dropped by method parsing.
- `attributeProducer` and `LaravelControllerScannerExecutor` consume this parser-owned inventory instead of rebuilding constructor input from the raw `methods` array.
- Attribute producer contract version advanced to 5. Laravel controller scanner contract version advanced to 42. Blocked constructor inventory propagates as a typed scanner blocker; no controller artifacts are published in that case.

## Trace

`CLI scan` → manifest composition → `LaravelSourceAstPipeline` → controller/attribute scanner → `ControllerDeclarationAst.methodDeclarationInventory` → `PhpClassMethodDeclarationInventory` → `PhpClassConstructorSelectionAuthorityInterface` → selected/missing/ambiguous/blocked judgment → closed scanner result → manifest publication gate.

## Scope and limitations

The inventory closes one concrete gap: method parse candidates dropped by `parseControllerMethod` no longer silently disappear before constructor selection. It does not yet prove that the custom token scan covers every PHP declaration construct (for example, nested named functions and tokenization failures need their own upstream source-evidence contract). Do not claim full PHP grammar completeness from this AST inventory alone.

Existing parser imports from `semantic/relations` predate this phase and remain unresolved; this phase does not claim that the whole parser path is relation-free. No `semantic/foundation` dependency was introduced.

## Verification

The phase audit is structural and checks contract consumption and blocked-result propagation. TypeScript project checking could not run in this environment: global TypeScript 5.8.3 rejects the repository's configured target/lib and the workspace lacks `node` and `vitest/globals` type packages. `npm run build` was not run.
