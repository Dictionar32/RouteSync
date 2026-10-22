# Phase 1594 — Interface-first migration readiness

## Decision

**Not ready for scanner/runtime cutover.** The interface boundary is stronger, but the end-to-end semantic authority producer does not yet exist in the source tree. This phase intentionally does not change scanner wiring, runtime execution, or the legacy solver.

## Source change

`packages/core/src/types/upstream/requestTypeDerivationInterface.ts`

- `RequestTypeDerivationSemanticPipelineInterface<TContract>` is now the consumer-facing boundary. It exposes only the closed contract and one source-bound `derive(input)` operation.
- The reasoning, verifier, and authority capabilities moved behind the separate `RequestTypeDerivationSemanticPipelineCompositionInterface<TContract>` composition surface.
- Scanner/runtime consumers can depend on the canonical pipeline without receiving direct capabilities to infer, verify, or adjudicate independently.
- The generic parameter correlates capability types but cannot guarantee at runtime that separately-created capability objects share the same contract object. A concrete composition factory must validate that binding.

## Trace findings

1. `requestTypeDerivationSolver.ts` still produces grouped `RequestType[]` by folding route data; it does not produce the declared closed `RequestTypeDerivationJudgment` with source disposition ledgers, contribution receipts, closure evidence, and proof.
2. No concrete implementation of `RequestTypeDerivationSemanticReasoningInterface`, `RequestTypeDerivationProofVerificationInterface`, or `RequestTypeDerivationSemanticPipelineCompositionInterface` was found under `packages/core/src`.
3. `requestTypeDerivationProjectionPipeline.ts` still calls `createDerivationContext` and `aggregateRequestTypeGroups`.
4. `routeManifestTypeLowering.ts` still uses that legacy projection pipeline as the default path. `routeManifestTypeLoweringAuthority.ts` is only an injected alternative.
5. The runtime executor consumes the canonical pipeline operation and does not itself call the legacy solver; that is a good boundary, but it is not the default path yet.

## Verification

- `node scripts/audits/audit-phase1594-request-type-migration-readiness.cjs`: executed; 6/9 checks passed. Three expected blockers remain: concrete reasoning, concrete verifier, and concrete composition implementation.
- `node scripts/audits/audit-phase1586-request-type-runtime-executor-interface.cjs`: 6/6 checks passed, with end-to-end cutover explicitly open.
- `npm run build`: not run successfully; the script exits with `tsdown: not found` (exit 127). No build success is claimed.
- No scanner wiring or runtime source was modified in this phase.

## Required gates before migration

1. Implement a semantic reasoning producer that consumes source evidence and emits a closed judgment with complete, source-bound ledgers and contribution receipts. It must not simply wrap `RequestType[]` in a `derived` tag.
2. Implement a verifier that checks every law in `REQUEST_TYPE_DERIVATION_LAW_IDS`, including source occurrence coordinates, closure, contribution transitions, and judgment/proof ledger coherence. Verification must not repair or reclassify the judgment.
3. Implement a composition factory that binds reasoning, verifier, authority, and pipeline to the same contract value; construct the correlated authority decision proof in the semantic layer.
4. Add tests for derived, incomplete, conflict, invalid input, malformed proof, incomplete law coverage, and contract-binding mismatch.
5. Only then switch scanner/CLI composition to the authority-backed path; prove the legacy path is no longer the default and compare output behavior on representative fixtures.
6. Run the project-pinned TypeScript 7 / tsdown build and tests in an environment with dependencies installed.

## Migration rule

Do not cut over wiring until gates 1–4 pass. Do not declare migration ready solely because the interfaces compile or static source audits pass.
