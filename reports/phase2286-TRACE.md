# Phase 2286 Trace — Upstream Contextual Attribute Proof

## Production path

`packages/cli/src/commands/scan.ts` → `controllerInvocationManifestComposition.ts` → `laravelSourceAstPipeline.ts` → `LaravelAttributeScannerInterface` → `LaravelContextualAttributeInventory` → `LaravelControllerScannerInterface.scan(...)` → existing action/dependency semantic judgment path.

## Root cause

The previous proof accepted any resolved PHP interface name while claiming Laravel's exact `Illuminate\\Contracts\\Container\\ContextualAttribute` contract. In addition, it duplicated the attribute class identity in both the enclosing declaration evidence and nested implementation proof. The contract could therefore represent semantically contradictory evidence.

## Change

- Evolved `LaravelAttributeScannerInterface` and `LaravelAttributeScanJudgment` contract version 4 → 5.
- Added `LaravelContextualAttributeContractResolution`, a narrowed existing-resolution judgment whose resolved qualified name is exactly Laravel's canonical interface identity.
- Removed the redundant `declarationIdentity` from the nested proof; `LaravelContextualAttributeDeclarationEvidence.qualifiedIdentity` remains the sole owner of the declared class identity.
- Aligned the existing composition-root metadata to version 5 without changing its semantic classification behavior.
- Added `scripts/audits/audit-phase2286-contextual-attribute-proof-identity-closure.cjs`.

## Validation

The focused static audit passed 10/10 checks; `node --check` passed for the audit script. No TypeScript typecheck or project build was run.

## Explicit limitations

The legacy regex in `attributeAstCanonical.ts` remains. The current producer does not yet construct `qualifiedIdentity` or `implementation` proof fields, so this phase is a contract correction and intentionally does not claim production type coherence. The follow-up must migrate the producer using the existing `phpClassNameResolutionContextAt` and `PhpClassNameResolutionRuleInterface`, then supply proof-bearing inventory evidence to the existing Laravel controller scanner.
