# Phase 2229 — Action Response Reference Source Authority

## Contract-first correction

`LaravelControllerActionSemanticJudgmentContract` is version 27. Its response-reference ownership now explicitly states that the canonical `ControllerResponseReferenceJudgment` comes from the exact controller-method response-attribute source evidence, not from the legacy `ResponseDescriptor`.

## Production change

`controllerActionContract.ts` now constructs the closed existing response-reference ADT directly from `ControllerMethodAst.responseAttribute` before creating the legacy response descriptor. The resulting canonical judgment is the value passed to return-semantic and dataflow derivation. The descriptor remains available for current compatibility consumers, but no longer supplies the canonical response-reference judgment.

This is deliberately a narrow authority correction, not a claim that integrated response migration is complete. The legacy descriptor still resolves DTO files and derives fields/shape through `responseAttributeScanner.ts`; the next migration step is to correlate the existing integrated response pipeline's per-method product to the exact action source span and consume that product in a compatibility projection. That step must not use a controller-wide DTO inventory as a substitute for method/source correlation.

## Architecture constraints

- No `relation`, `foundation`, or additional subscanner layer was introduced.
- No parallel response semantic authority was introduced; the existing `ControllerResponseReferenceJudgment` ADT and existing `LaravelControllerResponseSemanticPipelineInterface` remain authoritative at their respective boundaries.
- Invocation judgment and integrated response pipeline remain unchanged and continue to be retained on the scan artifact.
- Runtime executor remains a forwarder of the completed action judgment; no new runtime semantic reasoning was added.

## Verification

`packages/core/scripts/audits/audit-phase2229-action-response-reference-authority.cjs` checks the source-evidence ownership, both closed ADT outcomes, the compatibility-only descriptor boundary, contract version alignment, and absence of a new relation/foundation layer. This is a structural audit only; it does not replace TypeScript type checking or tests.
