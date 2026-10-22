# Phase 1588 — Interface-first authority projection composition

## Trace

`types/upstream/requestTypeDerivationInterface.ts` defines the source-bound semantic pipeline contract. `compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts` consumes the authority assessment and only projects a verified derived judgment. `compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts` injects the pipeline and carries non-projectable outcomes. Phase 1588 adds `compiler/scanner/wiring/routeManifestProjectionAuthority.ts` as the next composition boundary for consumers that require proof-backed RequestType semantics.

## Model improvement

The new projection composition requires a `RequestTypeDerivationSemanticPipelineInterface` dependency. It does not import or call the legacy `requestTypeDerivationProjectionPipeline`, does not classify source evidence, and does not turn incomplete/conflicting/unverified outcomes into an empty array. Its result algebra preserves `projected` versus `not_projectable`.

## Remaining cutover boundary

The existing default exports `routeManifestTypeLowering` and `routeManifestProjection` still use the legacy projection path because no concrete proof-producing semantic pipeline implementation is present in the repository's default composition root. This phase does not fabricate proof or route the legacy solver output through a proof-shaped type. The next phase must implement and independently verify the semantic producer, register it at the composition root, then migrate the default exports and all consumers together.

## Validation

Run `node scripts/audits/audit-phase1588-authority-backed-projection-composition.cjs`. This is a structural audit only. A successful audit is not a TypeScript build or runtime integration test.

## References

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- MLIR generic transformations with interfaces: https://mlir.llvm.org/docs/Tutorials/Toy/Ch-4/
- TypeScript narrowing and exhaustive discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
