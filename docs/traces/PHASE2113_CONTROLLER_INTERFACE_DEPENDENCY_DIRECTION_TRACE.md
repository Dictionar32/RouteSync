# Phase 2113 — Controller Interface Dependency Direction Trace

## Scope

This phase removes concrete compiler contract and AST imports from the upstream controller judgment/execution interfaces. It does not claim to retire the legacy scanner resolver or to migrate the canonical controller contract completely.

## Before

```text
upstream/LaravelControllerActionSemanticJudgmentInterface
  ├── imports compiler/frontend/php/controllerAstTypes
  └── imports compiler/scanner/descriptors/request/ControllerActionContract

upstream/LaravelControllerActionExecutionInterface
  └── imports compiler/scanner/descriptors/request/ControllerActionContract

compiler wiring
  └── binds scanControllerAction -> resolveControllerActionContract
```

The upstream contracts were tied to concrete compiler-owned evidence and a compiler-local descriptor, reversing the intended dependency direction.

## After

```text
upstream/LaravelControllerActionSemanticJudgmentInput<TMethodEvidence, TParameterEvidence>
  └── represents source evidence through type parameters

upstream/LaravelControllerActionSemanticJudgment<TProjection>
  └── represents the projection through a type parameter

upstream/LaravelControllerActionExecutionInterface<TProjection>
  └── forwards the completed judgment without classifying it

compiler wiring
  ├── specializes evidence to ControllerMethodAst / ControllerParameterAst
  ├── specializes projection to ControllerActionContract
  └── still binds the legacy scanControllerAction implementation
```

## Verified static invariants

- Upstream judgment interface no longer imports compiler AST types.
- Upstream judgment and execution interfaces no longer import `ControllerActionContract`.
- The compiler composition root owns the concrete specialization.
- Both judgment and execution retain explicit discriminants.
- The executor contract does not contain semantic branching.

## Known remaining work

1. The concrete projection is still `ControllerActionContract`; this phase does not yet replace it with `ControllerActionFlowContract`.
2. Production judgment still calls `scanControllerAction`, which invokes `resolveControllerActionContract`.
3. `ControllerActionContract` still aggregates AST, response, body, schema, runtime-return, and dataflow concerns.
4. Integrated response judgment and controller action judgment are not yet one closed canonical semantic result.
5. Relation algebra remains used throughout other scanner domains; this phase does not claim a global relation-free scanner.
6. Lattice/fixed-point migration is not included. It must follow a defined judgment order and merge semantics, not be introduced as a cosmetic layer.

## Validation boundary

Run `node scripts/audits/audit-phase2113-controller-interface-dependency-direction.cjs` for the targeted static checks. Build, TypeScript typecheck, and Vitest are intentionally not run in this environment.
