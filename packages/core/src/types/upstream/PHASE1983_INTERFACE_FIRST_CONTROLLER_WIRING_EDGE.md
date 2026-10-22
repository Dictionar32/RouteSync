# Phase 1983 — Interface-first controller wiring edge

## Trace finding

Phase 1982's interface described the already-shaped artifact and its projections, but did not describe the wiring operation itself. It was therefore a declaration of correlated fields, not a complete interface contract for the edge that forwards them.

The runtime implementation at `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still constructs `LaravelControllerScanArtifact` without `responseJudgment`, and still imports `semantic/relations` plus legacy controller subscanners. Those are outstanding implementation migration gaps.

## Contract improvement

`LaravelControllerInvocationResponseWiringInterface` version 2 declares a generic `forward` operation. Its input and output remain indexed by the same artifact subtype. `LaravelControllerInvocationResponseWiringResult` carries the canonical artifact and the artifact-owned invocation and response judgments.

The callable signature describes wiring only. It is not an invocation/response authority and has no permission to infer, classify, reconstruct, widen, or source-select semantic judgments. The implementation must forward the exact owned values and preserve the ADT outcome.

## Scope

- Type/interface and documentation changes only.
- No runtime implementation, executor, scanner, authority, registry, or subscanner is added or modified.
- No new `semantic/relations` or `semantic/foundation` dependency is introduced.
- Existing runtime imports are not claimed to be migrated; subscanner retirement remains gated on consumer migration.

## Verification boundary

The accompanying audit is structural only. TypeScript build/typecheck was not run. The interface is now explicit about the required wiring operation, but the production implementation remains nonconforming until it supplies `responseJudgment` and satisfies the forwarding contract.
