# Phase 1385 — Runtime Contract-Only Surface Trace

## Decision
Runtime is an executor/query surface, not the owner of semantic reasoning. The upstream producer must produce a closed `SemanticDataflowJudgment`; wiring may carry it, and runtime may expose read-only queries over its existing closure. Runtime must not receive raw `SemanticDataflowInput` as an alternate route to recompute a judgment.

## Actual path traced

1. `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` builds the complete Laravel source model and obtains `dataflowInputs` from `semanticDataflowInputsFromSourceModel(...)`.
2. `packages/core/src/types/upstream/semanticDataflowManifestSurface.ts` is the upstream reasoning handoff. It invokes `semanticDataflowReasoningAuthority.judge(...)` and stores the resulting closed judgments in the manifest.
3. `packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts` projects manifest data into a runtime-facing surface. Phase 1385 stops forwarding `manifest.dataflowInputs` here.
4. `packages/core/src/compiler/analysis/routeSyncManifestDataflowProjectionInterface.ts` now defines the runtime-facing surface explicitly as `dataflowJudgments` plus controller identities. It no longer extends `ManifestDataflowSeedSurface`, which exposed both seeds and judgments.
5. `packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts` selects an existing judgment by canonical identity and fails closed when it is absent.
6. `semanticDataflowRuntimeBoundary.ts` accepts `SemanticDataflowJudgment`, not `SemanticDataflowInput`; `semanticDataflowRuntimeComposition.ts` wires the judgment to `semanticDataflowDataFlowAdapter.ts`.
7. The adapter's `reaches` query checks membership in the already-closed `judgment.closure`. It does not invoke the reasoning authority, recompute closure, or construct a new judgment.

## Legacy analyzer
`packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts` still contains a deprecated compatibility facade that calls the canonical authority. In the traced production TypeScript tree it has no production importers; references are confined to tests. It is not part of the runtime path. Do not confuse “legacy file contains reasoning” with “runtime invokes reasoning”; keep its test-only status guarded by the audit.

## Type/interface evolution

- Before: `RouteSyncManifestDataflowSurface extends ManifestDataflowSeedSurface`, so the downstream-facing type exposed both `dataflowInputs` and `dataflowJudgments`.
- After: `RouteSyncManifestDataflowSurface` has only `dataflowJudgments: Sequence<SemanticDataflowJudgment>` and controller identity descriptors.
- Upstream retains `dataflowInputs` in `RouteSyncManifestFlow` for evidence, provenance, and audit purposes. This change does not delete source evidence or alter the upstream reasoning producer; it narrows only the runtime-facing projection.
- `package.json` version remains `1.0.49`; `build` remains `tsdown`.

## Verification
Run:

```sh
npm run audit:phase1385-runtime-contract-only-surface
npm run audit:phase1384-runtime-contract-execution-boundary
```

The audits are structural source checks. They do not substitute for a full TypeScript build or end-to-end test. A build result must be reported separately from these audits.
