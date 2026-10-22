# Phase 1850 — Resource Binding Declarative Semantic Interface

## Trace

Phase 1849 improved structural provenance equality, but the resource binding authority still encoded precedence as an imperative local array and selected the tier directly with helper functions. This left a meaningful semantic decision inside the compiler authority implementation.

## Interface-first change

Added `packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts` with `ResourceModelBindingSemanticRuleSetInterface` and `RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET`. The contract names the candidate-evidence relation, selected-precedence relation, precedence vocabulary, least-fixed-point strategy, ambiguity policy, and missing-evidence outcome. Precedence is expressed as declarative rewrite rules with negative premises for higher-priority evidence.

The resource model-binding authority now materializes source-backed candidate evidence as semantic relation facts and asks the shared `semanticRewriteRuntimeExecutor` to derive the selected evidence tier. It no longer owns a local imperative precedence list. All candidates at the selected tier remain present so the existing judgment algebra can preserve ambiguity.

The new upstream contract is exported through the upstream and core barrels. `LaravelResourceScannerInterface` and its judgment projection contract are advanced to version 9.

## Remaining boundary

This phase does not claim that all resource-binding reasoning has become declarative. Candidate evidence construction (controller evidence, relation propagation, and convention evidence), resolved/ambiguous/unresolved outcome construction, provenance equality, and batch cycle detection still use typed helper implementations in `resourceModelBindingAuthority.ts`. The next interface-first step should model those as upstream semantic facts/rules and make the authority an adapter to the shared relation engine, without merely relocating the same functions.

## Verification

- Phase 1850 static audit: 12 checks.
- Package JSON parse: required.
- ZIP integrity: required.
- Build/typecheck/E2E: not run.
