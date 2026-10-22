# Phase 2145 — Resource Binding Publication Ownership

## Scope

Trace the existing Laravel controller resource-binding path from AST evidence through the upstream judgment authority, dataflow contract, action contract, action semantic judgment adapter, scanner, integrated response judgment, and judgment-forwarding executor.

## Trace findings

1. `controllerDataflowContract.ts` constructs `ControllerResourceBindingCandidate` values from source evidence and calls `controllerResourceBindingAuthority.judge(...)`.
2. `controllerResourceBindingInterface.ts` defines the closed `ControllerResourceBindingJudgment` ADT (`resolved`, `unresolved`, `not_applicable`) and the authority contract.
3. `ControllerDataflowContract.resourceBindings` carries already-judged bindings with source ranges.
4. `legacyLaravelControllerExecutionDependencies.actionJudgment.judge` republishes those values into the canonical domain `ControllerResourceBinding` shape using a mapping adapter.
5. `LaravelControllerScannerExecutor` consumes the published judgment, forwards it through the action executor, and separately invokes the existing integrated-response pipeline with the same invocation judgment.
6. The action executor forwards the exact judgment and does not execute a generated target operation or upgrade semantic coverage.

## Correction

Earlier coverage called this debt `resource_binding_aggregation` and attributed the derivation to the legacy action contract. That was inaccurate: the semantic resource-binding judgment is already owned by `controllerResourceBindingAuthority`. The remaining debt is the legacy adapter's canonical domain publication, not the derivation itself.

Phase 2145 therefore:

- removes resource binding from `derivationOwnershipRemainder`;
- adds `LaravelControllerActionSemanticPublicationRemainder` with typed current owner, target owner, and source authority;
- retains body source AST and request-binding compatibility as open derivation ownership obligations;
- advances the action semantic judgment contract and production composition to version 14;
- updates affected audits and exports the new publication-remainder type;
- does not add a relation/foundation layer, subscanner, or duplicate authority.

## Remaining debt

- `scanControllerAction(...)` and `resolveControllerActionContract(...)` remain active in production.
- Body source AST remains a projection remainder and body derivation ownership remains open.
- Request binding still uses the compatibility adapter.
- Canonical resource-binding publication still traverses the legacy action judgment adapter.

## Verification

- Phase 2145 focused audit: 11/11 passed.
- Phase 2143 typed ownership audit: 14/14 passed.
- Phase 2142 coverage truthfulness audit: 9/9 passed.
- Phase 2130 dataflow knowledge boundary audit: 18/18 passed.
- Phase 2132 body semantic knowledge boundary audit: 18/18 passed.
- TypeScript syntax-only transpilation: 3/3 passed.
- Full build, full typecheck, and Vitest were not run.
