# Phase 2244 — Controller Dependency Semantic Ownership

## Decision

Controller parameter class-name resolution already has an upstream closed judgment. Dependency inclusion/exclusion and contextual-attribute selection were still implemented inside `compiler/scanner/descriptors/request/controllerActionContract.ts`. That was semantic reasoning hidden in a projection/resolver module.

Phase 2244 adds `ControllerDependencySemanticJudgmentInterface` and its upstream authority. Its input is AST-independent evidence: parameter origin, the existing class-name judgment, parameter identity, injection kind, and projected contextual-attribute evidence. Its output is a closed ADT: a resolved canonical `ControllerDependency` or a typed exclusion reason.

## Production wiring

The existing action resolver now projects AST parameter attributes into typed evidence and delegates the dependency judgment to the injected upstream authority. The authority itself imports no scanner, subscanner, relation, or foundation modules. The existing action judgment, invocation correlation, integrated response owner, resource binding owner, and runtime executor remain intact.

## Rules

- unresolved class-name judgment excludes a dependency;
- resolved constructor parameters publish a dependency;
- an explicit contextual attribute publishes a method dependency;
- a method parameter with model/request origin and no contextual attribute remains route/request binding rather than container dependency;
- a resolved expression/external method parameter without a contextual attribute is a container dependency.

The AST-to-domain expression-argument projection still uses existing expression-projection modules; this phase does not claim all Laravel subscanner imports are retired. `resolveControllerActionContract`, `createControllerDataflowContract`, body AST projection, and return semantic implementation remain outstanding migration work.

## Verification

Run `node scripts/audits/test-phase2244-controller-dependency-semantic-ownership.cjs` from the repository root. This is a structural audit only; no TypeScript typecheck, Vitest, or build is claimed by this document.


## Phase 2245 follow-up

Phase 2245 found and corrected a duplicated `dependencySemanticJudgmentAuthority` property in `ControllerActionContractResolverContext`. It also records `legacy_dataflow_resource_projection` as a separate typed action-coverage obligation. This is not a claim that dataflow migration is complete: `createControllerDataflowContract` still lives under `subscanners/controller`, imports `semantic/relations`, performs recursive AST traversal, and calls the existing resource-binding authority. That path must be redesigned before the subscanner and relation dependency can be retired without changing resource-binding behavior.
