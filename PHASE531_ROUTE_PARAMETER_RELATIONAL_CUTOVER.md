# Phase 531 — Route Parameter Relational Cutover

## Objective

Close the live scanner descriptor leak in `routeParameterDescriptorClass.ts` without replacing one procedural branch with another. The semantic authority is now relation-driven.

## Authority

`route evidence -> semantic option relation -> binding/type witness -> canonical route parameter -> solver/rewrite authority`

## Changes

- Route parameter presence is represented through `RelationOption` witnesses.
- Runtime absence classification is projected into relation vocabulary before semantic construction.
- Binding construction is selected through relation option folding and a location relation.
- Required/optional presence is selected through `relationGate`.
- Path suffix removal uses `relationTextSlice` rather than direct string slicing.
- Location normalization is relation-gated.
- Type inference is resolved through a relation option witness.
- `RawScannedRouteParameterInput.bindingField` is optional rather than carrying an absence sentinel in its type.
- No semantic authority remains in host-language branch constructs in the target.

## Inactive-path result

Phase 525 and Phase 528 audits were rerun before the cutover. Both report no remaining non-empty inactive production candidates.

## Verification

Phase 531 target audit:

- all forbidden surface counters: `0`
- `closedSurfaceClean=true`
- `transpileDiagnosticsClean=true`

Phase 530 regression audit remains clean.

Repository-wide TypeScript validation remains environment-dependent on the workspace's available type-definition packages; this phase claims target transpilation and surface validation, not a full repository typecheck.
