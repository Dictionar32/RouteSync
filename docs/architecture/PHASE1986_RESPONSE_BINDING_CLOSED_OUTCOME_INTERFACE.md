# Phase 1986 — Response Evidence Binding Closed-Outcome Interface

## Scope

This phase evolves existing upstream contracts only. It does not change the Laravel scanner implementation, runtime executor implementation, or wiring implementation. It does not add a `relation`/`foundation` layer, a replacement subscanner, or a second invocation authority.

## Root cause closed at the type boundary

The previous response source-binding ADT had two weaknesses:

1. A `complete` receipt could carry an empty evidence array.
2. A `rejected` receipt required every entry to be different-source, so it could not preserve a mixed evidence set containing both same-source and different-source items.
3. The response authority's return type depended on the invocation outcome but not on the source-binding outcome. As a result, the declaration did not prevent a complete response product from being returned for a rejected evidence binding.

## Contract changes

- `LaravelControllerResponseEvidenceSourceBindingEntry` associates each evidence item with its identity judgment.
- `LaravelControllerResponseEvidenceSourceBindingJudgment` now requires a non-empty tuple for both outcomes. The complete variant admits only same-source entries. The rejected variant requires at least one different-source entry and retains any other entries in the same receipt.
- `LaravelControllerResponseSemanticJudgmentFromInput<Input>` indexes the authority/executor result by the exact binding outcome.
- `LaravelControllerResponseEvidenceSourceBindingRejectedJudgment` explicitly retains the invocation judgment and rejected receipt.
- `LaravelControllerScanArtifact` can carry that rejected response judgment alongside the matching invocation outcome.
- Wiring forwards `Artifact['responseJudgment']` directly rather than intersecting it with a separately reconstructed response classification.
- `LaravelSubscannerRetirementInterface` advances to version 13.

## Invariants

- Each response evidence item must be represented exactly once in the receipt; this cardinality/coverage obligation remains a producer obligation and cannot be proven by structural typing alone.
- A rejected source-binding receipt cannot type-check as a complete response product through the authority's declared return type.
- The existing `LaravelSourceIdentitySemanticsInterface` remains the owner of source identity judgments.
- Invocation integration and HTTP response meaning remain separate authorities.
- AST/ADT projection must forward the closed controller artifact and must not reconstruct response semantics.

## Trace findings retained

The latest input archive still contains controller subscanner imports into `semantic/relations`; those runtime consumers have not been migrated in this interface-only phase. No `semantic/foundation` imports were found in the 12 non-empty controller modules previously traced. The legacy subscanner directory is not deleted because production consumers remain.

## Verification boundary

Run `node scripts/audits/audit-phase1986-response-binding-closed-outcome-interface.cjs` from the repository root for the structural audit. TypeScript build/typecheck was intentionally not run in this phase, and this document does not claim runtime compatibility.
