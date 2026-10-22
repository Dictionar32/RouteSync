# Phase 2284 — Upstream contextual-attribute proof contract

## CLI path traced

`packages/cli/src/commands/scan.ts` → `controllerInvocationManifestComposition.ts` → `laravelSourceAstPipeline.ts` → `LaravelAttributeScannerInterface.scan(...)` → `LaravelContextualAttributeInventory` → `LaravelControllerScannerInterface.scan(...)` → `LaravelControllerActionSemanticJudgmentAuthorityInterface.judge(...)`.

## Root cause

The inventory in Phase 2283 was source-project-scoped and typed, but the evidence still depended on `AttributeAst.definition.contextual`. `attributeAstCanonical.ts` sets that flag using `/implements[^\\{]*\\bContextualAttribute\\b/`, which is a lexical short-name check rather than resolved interface identity. This leaves semantic authority in the AST producer and does not prove the class implements the canonical Laravel contract.

## Contract change

- Evolved existing `LaravelAttributeScannerInterface` from version 2 to version 3.
- Added `LaravelContextualAttributeContractIdentity` with the canonical fully qualified Laravel contract name.
- Added `LaravelContextualAttributeImplementationProof` requiring the class-name resolution rule and interface source span.
- Strengthened each `LaravelContextualAttributeDeclarationEvidence` to require that proof.
- Kept `LaravelContextualAttributeInventory` as the shared contract consumed by the existing controller scanner.
- No runtime implementation or wiring was changed. The producer is deliberately not claimed to satisfy version 3 yet.

## Validation

Static contract audit: 8/8 checks passed. `node --check` passed. ZIP integrity passed. TypeScript typecheck and build were not run; the existing producer must be migrated before typechecking can pass against this stronger contract.
