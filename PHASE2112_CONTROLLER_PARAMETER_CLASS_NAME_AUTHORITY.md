# RouteSync Phase 2112 — Controller Parameter Class-Name Authority

This phase moves controller-parameter class-name interpretation behind a required upstream judgment interface. The canonical resolver no longer implements its own local class-name classifier.

The contract declares a closed rule vocabulary and a discriminated judgment. Resolved outcomes preserve the existing `ClassName` domain type and correlate the result with either a model-class or request-origin source. Unresolved outcomes retain distinct semantic reasons.

The production wiring injects the authority into `scanControllerAction`, which forwards it to `resolveControllerActionContract`. The resulting dependency remains part of the canonical `ControllerActionContract`, and the existing invocation judgment and integrated response path is preserved.

## Audit

Run:

```sh
node scripts/audits/audit-phase2112-controller-parameter-class-name-authority.cjs
```

This is a static structural audit. Build, typecheck, and Vitest were not run for this phase.

## Remaining scanner migration

This is not a claim that all scanner paths are free of legacy relations or subscanners. The action resolver still depends on legacy response, body, schema, dataflow, AST, expression, and resource helpers. The next scanner-focused phase should migrate the next semantic owner through its existing canonical contract rather than merely moving helper code.
