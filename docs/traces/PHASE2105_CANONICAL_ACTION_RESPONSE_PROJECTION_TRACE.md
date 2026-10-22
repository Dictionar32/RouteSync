# Phase 2105 — Canonical action response projection trace

## Change

`LaravelControllerScanner` previously constructed the response evidence for downstream method projection from `result.descriptor.response`. The descriptor is a compatibility projection produced for existing consumers. It must not become the semantic source when the executor already preserves `result.contract`.

The scanner now reads `result.contract.response.responseTypeName()` for this projection. This is a narrow source-of-truth correction: it does not claim that `ResponseDescriptor` itself has been retired, nor that the action contract resolver has stopped using legacy relation/subscanner helpers.

## Trace

```text
CLI scan
  -> LaravelSourceAstScanner / LaravelControllerScanner
  -> declaration correspondence + closure gate
  -> LaravelControllerActionExecutionInterface.execute
  -> legacy adapter (composition seam)
  -> resolveControllerActionContract
  -> ControllerActionContract + compatibility descriptor
  -> response projection reads ControllerActionContract.response
  -> controller method semantic projection / action projection
  -> ControllerProducer.produce({ declaration, invocationJudgment })
  -> source-correlated integrated invocation response
  -> AST / source model / IR / manifest projection
```

## Authority boundaries

- `LaravelControllerInvocationSemanticJudgmentInterface` owns the exact invocation source identity and outcome-indexed integrated invocation response.
- `LaravelControllerActionExecutionResult` preserves the exact invocation judgment and canonical action contract.
- `ControllerActionInfo` remains a compatibility descriptor; it is not used as the response source in the controller scanner after this change.
- `LaravelControllerResponseSemanticProduct` is a separate response-semantic ADT. This phase does not merge it with invocation integration outcomes because those represent different semantic questions.

## Legacy dependency status

The main controller scanner has no direct imports from `semantic/relations`, `semantic/foundation`, or `subscanners`. The composition adapter and `resolveControllerActionContract` still use legacy implementation dependencies. That is not a full retirement of those dependencies.

The fixed-point result ADT from Phase 2104 distinguishes `fixed_point_converged` from `fixed_point_round_limit_reached`. This phase does not yet migrate all dataflow solver callers to require the converged branch before publishing analysis output; that remains a concrete follow-up.

## Verification

Run the static audit:

```sh
node scripts/audits/audit-phase2105-canonical-action-response-projection.cjs
```

No build, TypeScript typecheck, or Vitest run is claimed for this phase.
