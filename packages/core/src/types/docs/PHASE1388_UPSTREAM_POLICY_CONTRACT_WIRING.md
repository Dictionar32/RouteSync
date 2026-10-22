# Phase 1388 — Upstream Query-Policy Contract Wiring

## Trace

`createLaravelSourceProjectIdentity(root, intent)` → `SourceProjectIdentity.dataflowQueryPolicyIntent` → `constructRouteSyncManifest` → `SemanticDataflowJudgment` → `materializeSemanticDataflowQueryPolicy` → `RouteSyncManifest.dataflowQueryPolicyContracts` → `RouteSyncManifestFlow` → `RouteSyncManifestDataflowSurface` → `analyzeRouteSyncManifestDataflowWithPolicy` → Runtime policy executor.

## Change

Before this phase, the source/sink intent was converted into closed contracts by a helper in the integration test. The Runtime API accepted those contracts as a third argument, so the production-shaped upstream manifest flow did not own or transport them. This left a gap between the stated architecture and the actual call path.

Now source/sink query intent is an explicit optional field on `SourceProjectIdentity`. When supplied, the upstream manifest builder materializes one closed policy contract per closed dataflow judgment. The concrete manifest, manifest flow, and Runtime-facing projection carry the resulting contracts unchanged. `analyzeRouteSyncManifestDataflowWithPolicy` defaults to the contracts on its input surface and fails closed if a matching policy is missing.

No default route/resource policy is injected. Projects that do not declare query intent receive an empty policy-contract set; policy-dependent analysis must not silently infer a policy at Runtime.

## Runtime guarantee

`semanticDataflowFactAnalysisPolicy.ts` only consumes `contract.sourceFacts`, `contract.sinkFacts`, and `contract.selectedFacts`. It does not inspect producer names or select facts by producer domain. The adapter queries the already-closed judgment and does not rebuild closure.

## Validation boundary

The Phase 1388 audit is a static source-contract audit. It does not prove the TypeScript build or end-to-end tests. Those still require the repository's dependency installation and a successful build/test run.
