# Phase 1887 — Controller Resource Binding Reuses Canonical Response Interface First

## Trace finding

`ControllerResponse` in `packages/core/src/types/upstream/controller.ts` already models the response as the closed union `response_present | response_absent`. Phase 1886 added a weaker, semantically duplicate `ControllerResourceBindingResponseEvidence` union (`present | absent`) to the resource-binding interface. That introduced a second response vocabulary and required the scanner to project between equivalent contracts.

## Interface-first correction

- `ControllerResourceBindingCandidate` now carries the existing `ControllerResponse` contract directly.
- Removed `ControllerResourceBindingResponseEvidence` rather than retaining a compatibility alias.
- Resource-binding authority now consumes the canonical `response_present` / `response_absent` discriminants.
- Both controller dataflow entry paths pass the canonical `ControllerResponse` value; AST canonicalization no longer remaps it into a second union.
- Resource-binding authority contract version advanced to v2 and explicitly records the canonical response ownership rule.
- Laravel controller scanner input/output contract version advanced to v15 and ownership boundary to v57.
- Previously emptied `actionVariableTracker.ts` and `controllerErrorDetector.ts` remain empty. `semantic/foundation` remains unused.

## Validation

Run `node scripts/audits/audit-phase1887-controller-resource-binding-reuses-canonical-response-interface-first.cjs` plus the focused regression audits for phases 1886, 1885, and 1884. This phase does not claim a full TypeScript compile or full build.
