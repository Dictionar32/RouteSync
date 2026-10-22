# Phase 1981 — Interface-first controller trace

## Scope

Interface/type declarations and type-only public exports only. No runtime scanner, authority, executor, resolver, AST projection implementation, or wiring is changed. No `semantic/relations`, `semantic/foundation`, replacement subscanner, or parallel invocation authority is introduced.

## Existing contract path

`LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt` → `LaravelControllerInvocationSemanticJudgmentInterface` → `LaravelControllerResponseSemanticJudgmentFor<exact invocation outcome>` → `LaravelControllerScanArtifact` → `LaravelSourceAstProjectionJudgment`.

The invocation judgment remains the source-correlated owner of PHP invocation integration. The response judgment is a separate Laravel controller response meaning, indexed by the exact invocation outcome. `InvocationSemanticIntegratedResponseCompositionInterface` remains the existing PHP invocation integration boundary; it is not treated as a response DTO parser. `LaravelSourceAstProjectionJudgment` owns complete/blocked AST projection outcomes, not response classification.

## Findings

- Existing controller artifact already pairs invocation and response judgment variants. This is stronger than carrying two independent broad unions, but it only proves type-level outcome compatibility; source identity equality still requires existing runtime source-binding validation.
- Existing source AST pipeline exposes a complete/blocked projection ADT carrying the inventory closure receipt.
- Existing controller subscanner modules still have production consumers; the legacy directory cannot yet be deleted safely.
- A responsibility map is not a substitute for migration. This phase exposes the shared type correspondence and executor obligations, without claiming the legacy implementations have been replaced.

## Interface-first rule

The runtime executor must receive an already correlated artifact, preserve the original invocation and response judgments, and project the existing complete/blocked AST result. It must not reconstruct source identity, classify response descriptors, infer invocation outcomes, or turn blocked/rejected/not-connected into success.

## Verification boundary

The audit checks declaration shape, type-only exports, prohibited-layer exclusions in the new contract, and the no-runtime-change scope. It does not prove TypeScript assignability or project build correctness; no project build/typecheck is claimed.
