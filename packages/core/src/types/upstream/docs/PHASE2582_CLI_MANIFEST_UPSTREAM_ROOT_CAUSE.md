# Phase 2582 — CLI → Manifest → Upstream Root-Cause Trace

## Finding

The manifest producer path is wired through `RouteSyncCliUpstreamCompositionInterface.manifestComposition` and the concrete `controllerInvocationManifestCompositionAuthority`. The source-occurrence inventory key producer from Phase 2581 is also owned by `core/src/types/upstream` and consumed by its verifier.

The blocking gap is one level higher: the executable CLI entry creates `createProgram()` without a `RouteSyncCliUpstreamCompositionInterface`, while both `scan` and `sync` require that complete composition before source acquisition. The production semantic pipeline factory is an assembler for injected capabilities, not a producer of the capabilities. The repository's own production-composition module explicitly records that concrete reasoning, proof-verification, decision, and authority capabilities are not supplied in the production tree.

This is not a reason to add a fallback or move semantic reasoning into CLI/runtime. The correct next evolution is to implement/connect the missing upstream semantic operations and compose the four capabilities into the existing `RequestTypeDerivationSemanticPipelineCompositionInterface`; then bind that complete pipeline together with the already-existing manifest authority at the CLI composition root.

## Actual path

`CLI executable` → `createProgram()` → `createScanCommand/createSyncCommand` → closed pipeline-resolution ADT → (currently missing composition, terminal rejection) → if composed: manifest authority → source discovery/read/identity binding → invocation judgment + inventory authority → manifest builder → request/resource preflight → injected RequestType semantic pipeline → manifest projection.

The pipeline-resolution gate occurs before source acquisition, so the current executable cannot reach manifest production. That fail-closed behavior is correct for semantic safety, but the default CLI is not production-operational yet.

## Ownership decisions

- Keep manifest production in `ControllerInvocationManifestCompositionAuthorityInterface` and its existing upstream dependency graph.
- Keep source inventory, canonical identity, semantic judgment, proof verification, decision, and authority upstream-owned.
- Do not use `requestTypeDerivationSolver` as a fallback.
- Do not introduce dependencies on `semantic/foundation`, `semantic/relation`, or the retired subscanner path.
- Do not claim full CLI → manifest success until a concrete production semantic pipeline is composed and an end-to-end test reaches manifest projection.

## Validation scope

`node scripts/audits/audit-phase2582-cli-manifest-upstream-root-cause.cjs` verifies the composition boundary and reports the missing concrete producer as a blocker, without treating that blocker as a passing runtime test. The Phase 2581 inventory audit and Phase 2561/2565 wiring audits should also be rerun. Typecheck, package build, Vitest, and CLI E2E remain separate required validations.
