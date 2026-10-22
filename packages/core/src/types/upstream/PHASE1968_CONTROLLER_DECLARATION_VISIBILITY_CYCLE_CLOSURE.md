# Phase 1968 — Controller Declaration Visibility and Cycle Closure

## Trace origin

Phase 1967 moved controller action selection and ancestry traversal behind `ControllerDeclarationSemanticJudgment`. A closer trace found two defects in that authority's input/output model:

1. `ControllerDeclarationMethodCandidate` carried method name and storage, but not visibility. `selectActions` therefore treated private/protected methods as action candidates even though Laravel controller actions are externally callable methods.
2. On an inheritance cycle, `ancestryFor` emitted the repeated parent into `inheritedControllerNames`. That made the inheritance list contain a duplicate/self identity even though the termination ADT already represented the cycle.

## Changes

- Added `ControllerDeclarationMethodVisibility` to the upstream declaration contract.
- Wired parsed method visibility from `ControllerMethodAst` into the upstream candidate evidence.
- Made the existing upstream authority select only `public` and `implicit` methods, while preserving constructor and `HasMiddleware::middleware()` exclusions.
- Changed cycle closure so the repeated parent is represented by `ancestryTermination.repeated`, not duplicated in `inheritedControllerNames`.
- Added focused regression tests for method visibility and cyclic ancestry.
- Preserved the exact `invocationJudgment` object passed into `controllerProducer.produce`.

## Architecture boundary

No `relation` or `foundation` subscanner was introduced. The existing upstream declaration authority was evolved in place.

This phase does **not** claim the whole controller pipeline is semantically closed. `controllerMethodContractFromMethod` still derives `HasMiddleware` policy from declaration interfaces and method bodies while projecting contracts. That is a separate remaining authority boundary and must be traced before migrating it; do not call the current runtime a pure executor yet.

## Verification

Run `node scripts/audits/audit-phase1968-controller-declaration-visibility-cycle-closure.cjs` for the structural audit. The focused Vitest file is added but no package build or test suite is claimed here.
