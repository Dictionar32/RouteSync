# RouteSync Phase 2113 — Controller Interface Dependency Direction

This phase makes the upstream judgment and execution interfaces independent of concrete compiler AST and descriptor types. The compiler composition root now selects concrete source-evidence and projection types.

It is a bounded architectural correction, not a claim that the controller semantic pipeline is fully migrated. The legacy scanner still creates `ControllerActionContract`; replacing it with `ControllerActionFlowContract`, integrating response judgment, and retiring relation/foundation dependencies remain subsequent work.

Audit:

```sh
node scripts/audits/audit-phase2113-controller-interface-dependency-direction.cjs
```

Build, typecheck, and Vitest were not run.
