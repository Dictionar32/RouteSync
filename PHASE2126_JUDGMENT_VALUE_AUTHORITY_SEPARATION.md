# Phase 2126 — Judgment Value / Authority Separation

## Evaluation finding

Phase 2125 had a naming/ownership mismatch: `LaravelControllerActionSemanticJudgmentInterface` described a completed judgment in its documentation but also exposed `judge(...)`, making the same interface both a semantic value contract and a callable producer boundary. This was weaker than the existing invocation model, which separates its closed judgment ADT from `LaravelControllerInvocationSemanticJudgmentAuthorityInterface`.

## Change

- `LaravelControllerActionSemanticJudgmentInterface<TProjection, TInvocationJudgment>` now describes only a completed value: exact invocation judgment, canonical action semantic knowledge, and consumer projection.
- `LaravelControllerActionSemanticJudgmentAuthorityInterface<TProjection, TMethodEvidence, TParameterEvidence>` owns `judge(...)` and the authority contract.
- Scanner dependency wiring depends on the authority interface.
- The action runtime executor accepts the completed judgment value interface and forwards the exact object.
- The public type export includes both contracts.
- Existing response pipeline ownership and exact invocation correlation remain unchanged.

## Trace debt that remains

The production authority still calls `scanControllerAction`, which calls `resolveControllerActionContract`. That resolver currently derives body, return, response-presence, request binding, dependencies, dataflow, schema, and runtime return. This phase deliberately does not claim those semantics have been migrated upstream, and it does not move the resolver wholesale into a new file.

## Next implementation frontier

Trace each resolver responsibility to an existing canonical upstream owner before wiring changes. Start with the shared response-presence ADT because return semantics and dataflow already consume the same value; then evaluate body/dataflow, request binding, dependencies, schema, and runtime-return evidence independently. Preserve the controller-wide integrated response judgment as a separate correlated judgment and keep runtime execution forwarding-only.

## Verification boundary

Run the static audit scripts listed in `package.json`. No build, typecheck, or Vitest result is claimed by this phase.
