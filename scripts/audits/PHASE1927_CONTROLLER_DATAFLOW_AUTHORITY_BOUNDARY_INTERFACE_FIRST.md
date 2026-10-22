# Phase1927 — Controller Dataflow Authority Boundary (Interface First)

## Trace findings

- Phase1865 had a `ControllerDataflowSemanticJudgmentAuthorityInterface`, but its evidence model predated the current binding-payload correspondence and variable-identity ADTs.
- Phase1925/1926 had richer ADTs and preserved `invocationJudgment` separately from `invocationSemanticIntegratedResponse`, but `controllerDataflowAnalyzer.ts` still orchestrated correspondence, identity, definition projection, and flow composition.
- A whole-file rollback to Phase1865 would discard newer source-payload provenance and the explicit correlated per-binding outcome model.

## Interface-first repair

- Restored the upstream ownership shape as `ControllerDataflowSemanticJudgmentAuthorityInterface` and `ControllerDataflowSemanticJudgmentAuthorityInput` without restoring the old, weaker evidence shape.
- Added `controllerDataflowSemanticJudgmentAuthority` as the single owner of correspondence-to-identity closure, unresolved outcomes, canonical variable-flow composition, and integrated-response composition.
- Kept parser-owned PHP expression projection behind `ControllerDataflowDefinitionProjectionAuthorityInterface` and a PHP-specific adapter.
- Reduced `controllerDataflowAnalyzer.ts` to source evidence acquisition, one authority call, and forwarding the complete model.
- Preserved `invocationJudgment` and `invocationSemanticIntegratedResponse` as distinct fields; neither is reconstructed from the other.
- Exported the new interface and authority from the upstream barrel.

## Verification

Run `node scripts/audits/audit-phase1927-controller-dataflow-authority-boundary.cjs`.

This is a static source-contract audit only. Full build, TypeScript compilation, and behavioral tests were not run in this phase.
