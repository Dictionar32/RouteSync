# Phase 1383 — Runtime as a Closed-Contract Executor

Date: 2026-10-09

## Decision

Runtime wiring must accept `SemanticDataflowJudgment`, not `SemanticDataflowInput`. The input is upstream evidence; the judgment is the output of upstream semantic reasoning. Runtime may query/project the judgment, but it must not seed, judge, close reachability, or synthesize proof.

## Trace

1. `packages/core/src/types/upstream/semanticDataflowInputFactory.ts` constructs canonical seed inputs from normalized producer evidence.
2. `packages/core/src/types/upstream/semanticDataflowManifestSurface.ts` now owns `semanticDataflowJudgmentsFromInputs`. It invokes the canonical `semanticDataflowReasoningAuthority.judge` before the runtime boundary and emits a `Sequence<SemanticDataflowJudgment>`.
3. `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` creates `dataflowInputs` once and derives `dataflowJudgments` from that exact sequence.
4. `packages/core/src/types/upstream/manifest.ts`, `packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts`, and `packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts` carry the closed judgments unchanged.
5. `packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts` now accepts only `SemanticDataflowJudgment`.
6. `packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts` is a pure projection: it keeps the same judgment as both `input` and `state`, forwards its reasoning contract, and exposes a read-only reachability query. It imports no authority and calls no `judge`.
7. `packages/core/src/compiler/analysis/semanticDataflowRuntimeComposition.ts` only invokes the pure projection.
8. `packages/core/src/compiler/analysis/semanticDataflowPipeline.ts` and `routeSyncDataflowAnalysis.ts` consume judgments, not raw seeds.
9. `packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts` and target-facing consumers continue to use the closed dataflow state. `packages/react/src`, `packages/sdk/src`, `packages/cli/src`, and `examples/ecommerce-shop-source` remain projections/execution layers, not authorities for Laravel semantics.

## Contract evolution

Before:

`manifest.dataflowInputs -> runtime.project(input) -> adapter calls authority.judge(input) -> closed judgment`

After:

`upstream input seeds -> upstream authority -> manifest.dataflowJudgments -> wiring.project(judgment) -> read-only runtime executor`

The seed input remains in the manifest as evidence/compatibility material, but the runtime boundary no longer accepts it. The manifest transports both seed evidence and closed judgments so provenance and auditability are retained.

## Ownership rules

- **Upstream reasoning authority:** constructs facts, fixed-point closure, paths, derivation witnesses, and the closed judgment.
- **Wiring/interface:** preserves identity/proof and adapts shape only; no reclassification or closure.
- **Runtime:** reads and queries the contract; no `judge`, seed interpretation, proof synthesis, or fixed-point execution.
- **IR/graph/manifest/SDK/React/CLI/Next.js/Axios/Zod/TanStack Query:** consume canonical projections; they must not infer Laravel method/path/middleware semantics from endpoint strings.

## Static audit

`npm run audit:phase1383-runtime-closed-contract-executor`

The audit checks the handoff from upstream production through manifest/flow and into runtime, plus preservation of package version `1.0.49` and build command `tsdown`.

## Verification limitation

Static audits are not a substitute for typechecking or runtime tests. At this workspace snapshot, `npm run build` cannot start because the local `tsdown` executable is absent (`sh: 1: tsdown: not found`). No successful build is claimed.

## Documentation research

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — transformations/analyses should query generic interfaces instead of hard-coding concrete operation semantics.
- TypeScript narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html — discriminated unions encode closed variants and allow type narrowing.
- TypeScript 7.0 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — native compiler port; compatibility and deprecation defaults should be audited independently.
- CodeQL dataflow: https://codeql.github.com/docs/writing-codeql-queries/about-data-flow-analysis/ — dataflow/path queries are useful as independent source-to-sink verification, not as RouteSync's semantic authority.
- Next.js Route Handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route — target execution conventions.
- Zod basics: https://zod.dev/basics — schema parsing and inferred target types.
- TanStack Query TypeScript: https://tanstack.com/query/latest/docs/framework/typescript — query-function result inference and target typing.

## Next recommended phase

Extend the same closed-judgment handoff discipline to AST/ADT and operation identity consumers. Add a contract-identity test that verifies the exact judgment/proof object crosses wiring unchanged, then add a TypeScript compile check and runtime integration test when dependencies are available. Do not add a second runtime reasoning API to solve missing upstream contract data; make the upstream producer complete the contract instead.
