# Phase 2213 — Response Pipeline Contract Version Closure

## Baseline

RouteSync Phase 2212 — Existing Response Authority Boundary.

## Trace finding

`LaravelControllerResponseSemanticPipelineInterface` declares `contractVersion: 30`, and the exported `pipelineContract` also declares `contractVersion: 30`. The runtime factory `createLaravelControllerResponseSemanticPipeline` previously returned an object with `contractVersion: 29`. This was a concrete interface/implementation identity mismatch at the existing response authority boundary.

## Change

The runtime pipeline now publishes `contractVersion: 30`, matching both the interface and its contract. A regression test asserts all three values remain synchronized. No new authority, relation layer, foundation layer, or subscanner was introduced.

## Authority trace retained

- PHP invocation meaning remains owned by `LaravelControllerInvocationSemanticJudgmentInterface` and its authority.
- Integrated Laravel HTTP response meaning remains owned by `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse`.
- DTO declaration resolution, DTO property type-reference binding, and DTO `ResponseContract` projection remain existing upstream products.
- Runtime scanner wiring forwards the closed invocation/response judgments to AST projection; it must not reconstruct either judgment.

## Remaining gaps

1. `scanControllerAction` and `resolveControllerActionContract` still form the legacy action production path.
2. `resolveResponseAttributeAst` still resolves DTO classes and merges observed fields; it is not yet retired in favor of the existing response pipeline's DTO products.
3. Resource-binding domain publication still passes through the legacy action adapter.
4. `ChannelScanner.scanCanonicalAsts(sourceProject)` still lacks a proven authoritative client-subscription evidence inventory.
5. `semantic/relations` usages remain and need a per-call distinction between structural collection shaping and semantic inference.

This phase closes the concrete version mismatch only. It does not claim the remaining legacy scanner derivations are retired.
