# Phase 1587 — Interface-first runtime executor trace

## Source-to-consumer trace

1. `types/upstream/requestTypeDerivationInterface.ts` owns the source evidence, closed `RequestTypeDerivationJudgment`, proof/verification types, semantic authority assessment, pipeline interface, and judgment-only consumer interface.
2. `compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts` consumes the authority pipeline and dispatches only the already-established assessment variant. It does not resolve request identities or aggregate groups.
3. `compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts` is the new injectable interface-first lowering adapter. It constructs source evidence from the manifest, invokes the runtime executor, and projects only `judgment.groups`. Incomplete/conflict/rejected/unverified/inconsistent outcomes remain explicit and cannot be silently converted to an empty list.
4. `compiler/scanner/wiring/routeManifestTypeLowering.ts` and `routeManifestProjection.ts` still use the legacy projection pipeline by default. This is an explicit remaining cutover, not a claim of end-to-end migration.

## Semantic-model improvement

The key model distinction is between evidence, inference, verification, adjudication, and projection. The pipeline contract must return a proof-backed assessment. The runtime executor is not allowed to invent or reconstruct proof. The consumer receives a closed judgment rather than raw route/resource/request evidence.

## Why the remaining `switch` is allowed

The executor's `switch` dispatches a discriminated authority outcome that has already been classified upstream. It does not decide whether a route is a request, resolve resource identity, or merge contributions. Exhaustive dispatch preserves each outcome and makes new variants a compile-time concern.

## Remaining blocker

No proof-producing `RequestTypeDerivationSemanticPipelineInterface` implementation is currently wired into the default composition root. The legacy `requestTypeDerivationProjectionPipeline` still invokes `createDerivationContext` and `aggregateRequestTypeGroups`. Do not route that result through a fabricated proof or label it verified. The next phase must implement and test a real producer/verifier, then replace the legacy default path and verify all consumers.

## Validation

`node scripts/audits/audit-phase1587-interface-first-runtime-executor.cjs` checks the source boundary and explicitly records that legacy cutover remains open. Full TypeScript build is not asserted by this phase.
