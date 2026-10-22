# Phase 2220 — Canonical Action Controller Identity

## Trace and defect

Phase 2219 moved route/action selection into the existing upstream correlation authority and checked the publication against the projection identity, canonical action name, and exact method source span. The trace still showed one missing canonical fact: `LaravelControllerActionSemanticKnowledge` published `actionName` and `source`, but did not publish `controllerName`. Consequently, the route correlation authority could not compare the publication's controller identity against the semantic judgment itself; it could only compare against the consumer-owned projection.

## Change

- Evolved the existing `LaravelControllerActionSemanticKnowledge` contract with `controllerName: ControllerName`.
- Published the controller identity directly from `LaravelControllerActionSemanticJudgmentInput.controller` in the existing action-judgment producer.
- Advanced the action semantic judgment contract from version 25 to 26 and declared the canonical controller identity correlation invariant.
- Updated the knowledge coverage tuple to include `controllerName`.
- Strengthened and versioned the existing route/action correlation contract (1 → 2): publication identity must agree with both the semantic judgment and its projection, as well as the canonical action name and source provenance.
- Added static regression coverage for semantic identity publication and route correlation.

## Architecture boundary

This evolves an existing upstream semantic judgment; it does not add `semantic/foundation`, a relation replacement, or another subscanner. Route scanner continues to delegate selection to the existing correlation authority. The change does not claim that the legacy action derivation has been retired: `scanControllerAction` and `resolveControllerActionContract` remain in the action producer path. The integrated response pipeline remains the owner of response DTO/class binding and response-contract projection; this phase does not reconstruct response semantics or mark its migration complete.

## Validation

- TypeScript syntax transpilation: 6/6 changed and regression-test files pass with zero syntax diagnostics.
- Structural assertions: 9/9 pass.
- Vitest, full typecheck, and package build are not claimed unless run separately in a supported project environment.
