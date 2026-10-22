# Phase 2280 — Laravel Scanner Upstream Authority Contract

## Intent

Continue Phase 2279 by clarifying the existing `LaravelControllerScannerInterface` first. This phase does not move semantic derivation into a different runtime file and does not claim that the production scanner is fully Interface First.

## Production path traced

`packages/cli/src/commands/scan.ts`
→ `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
→ `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`
→ `LaravelControllerScannerInterface.scan(...)`
→ `LaravelControllerActionSemanticJudgmentAuthorityInterface.judge(...)`
→ sibling consumer projection.

The controller scanner executor still parses controller declarations and passes `ControllerMethodAst` to the action judgment authority. The action judgment authority still has explicit upstream obligations for method-AST semantic derivation and return-semantic production adapter. The dataflow path still reaches `createControllerDataflowContract(...)`, and `ControllerDataflowSemanticJudgmentAuthority` has a transitive `semantic/relations` dependency. These are not treated as migrated.

## Interface-first correction

- Evolved the existing `LaravelControllerScannerInterface` and its complete/blocked scan outcomes from contract version 37 to 38.
- Reused the existing `LaravelControllerActionProjectionMigration` contract on `LaravelControllerScannerInterface` instead of inventing a parallel migration model or representing ownership status as a primitive string.
- The scanner composition exposes the existing `controllerActionProjectionMigration` value to satisfy the evolved interface. This is contract metadata only; it does not change scan behavior or semantic derivation.
- Kept method AST derivation, return adapter, legacy action projection and relation-backed dataflow as explicitly open obligations.
- The scanner upstream interface file does not import `semantic/foundation` or `semantic/relations`.

## Validation

`node scripts/audits/audit-phase2280-laravel-scanner-interface-authority-boundary.cjs` passed 8/8 checks. `node --check` passed for the audit script. ZIP integrity was checked after packaging.

No TypeScript typecheck or package build was run. The static audit does not prove compilation or full runtime conformance.

## Next interface-first step

The next substantive change should evolve the existing source-evidence and semantic-judgment contracts so the production action authority can consume typed method/body/return evidence and already-closed judgments, instead of deriving meaning from `ControllerMethodAst`. After that interface is complete, wire the CLI path to it, prove source identity and response provenance are retained, and only then retire the legacy action projection and relation-backed dataflow path.
