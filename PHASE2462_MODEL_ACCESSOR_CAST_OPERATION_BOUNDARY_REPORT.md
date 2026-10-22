# Phase2462 — Model Accessor/Cast Operation Boundary

## Scope

This phase continues from Phase2461 and migrates the accessor and cast derivation entry points out of `compiler/scanner/subscanners/model`. It reuses the existing upstream output facts (`ModelAccessorFact`, `ModelCast`) and exposes each scanner operation through a typed interface-backed constant.

## Changes

- Added `compiler/scanner/modelAccessorFactsDerivation.ts` with `ModelAccessorFactsDerivationInterface` and `export const modelAccessorFactsDerivation: ModelAccessorFactsDerivationInterface`.
- Added `compiler/scanner/modelCastFactsDerivation.ts` with `ModelCastFactsDerivationInterface` and `export const modelCastFactsDerivation: ModelCastFactsDerivationInterface`.
- Moved `modelAccessorExpressionMapper.ts` to the scanner root.
- Wired `laravelModelScanner.ts` directly to both operations.
- Removed the former `memberAccessorsParser.ts`, `memberCastsParser.ts`, and old mapper locations.
- Removed direct `semantic/relations` and `semantic/foundation` imports from both moved derivation operations.
- Corrected cast-property input to read the existing `initialization` ADT rather than the nonexistent `property.value` shape.

## Architecture finding still open

The new operation interfaces are currently scanner-local because their inputs use compiler-owned `ModelDeclarationAst` and `PhpClassPropertyAst`. Moving these interfaces into `types/upstream` without first defining upstream-owned source-evidence ADTs would invert the dependency direction. Therefore, this phase does **not** claim that the missing upstream operation contract problem is fully solved. The next correct architectural step is to define upstream-owned accessor/cast source evidence, adapt the lexer AST to that evidence at the scanner boundary, and then relocate these operation contracts upstream.

Direct imports were removed from the two derivation modules, leaving 9 model helper files with direct `semantic/relations` imports and 0 model helper files with direct `semantic/foundation` imports. The broader scanner directory still has 140 files with direct relation/foundation imports. Transitive relation dependencies also remain through `EloquentCastMapper` and `projectPhpAstExpressionToUpstream` / `phpAstExpressionSemanticAuthority`. This phase does not claim the complete CLI path is relation/foundation-free.

## Validation

Run:

```sh
node scripts/audits/audit-phase2462-model-accessor-cast-operation-boundary.cjs
node scripts/audits/audit-phase2461-model-accessor-upstream-closure.cjs
```

A targeted TypeScript check reported no diagnostics in the two new derivation modules or the moved expression mapper; checking the scanner entry point is blocked by the absent Node.js type declarations for `path`, while the transitive project check reports existing unrelated errors. Full typecheck, Vitest, package build, and CLI regression were not run because installed dependencies are unavailable.
