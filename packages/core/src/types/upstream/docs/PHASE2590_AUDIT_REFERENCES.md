# Phase 2590 — Trace References

- `packages/cli/src/index.ts`: executable calls `createProgram()` without composition.
- `packages/cli/src/upstreamCompositionInterface.ts`: canonical CLI boundary shape.
- `packages/cli/src/upstreamCompositionFactory.ts`: wiring-only composition operation.
- `packages/cli/src/commands/scan.ts` and `packages/cli/src/commands/sync.ts`: fail closed before source acquisition when semantic composition is absent; use authority-backed manifest projection when present.
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts`: explicitly states missing production reasoning/verifier/decision/authority capabilities.
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts`: existing canonical capability assembly boundary.
- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`: canonical contract, law inventory, semantic judgment/ADT, producer and consumer interfaces.
- `packages/core/src/types/upstream/docs/PHASE2584_CLI_MANIFEST_UPSTREAM_END_TO_END_TRACE.md`: prior active-path trace.
- `packages/core/src/types/upstream/docs/PHASE2589_COVERAGE_CONTRACT_IDENTITY_CLOSURE.md`: Phase 2589 identity repair and its explicit boundary.
