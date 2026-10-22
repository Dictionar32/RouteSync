# Phase 1590 — Interface-First Runtime Assessment Integrity

## Trace

- `types/upstream/requestTypeDerivationInterface.ts` defines the closed semantic assessment and correlated decision proof.
- `compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts` is the runtime consumer of that contract.
- `compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts` translates all non-projectable executor outcomes into a typed lowering failure; it must not fall back to the legacy solver.
- `compiler/scanner/wiring/routeManifestTypeLowering.ts` still owns the legacy default projection path. The authority-backed path is not yet installed as the default because no production proof-producing semantic pipeline is wired at the composition root.

## Change

The executor now checks runtime proof coherence before projecting a successful result:

- assessment discriminant matches proof conclusion;
- successful derivation uses the expected rule, `derived` judgment, valid verification, and complete coverage;
- the proof's coverage contract matches the injected pipeline contract;
- incomplete/conflict/rejection/failure outcomes must match their corresponding proof rule and judgment/verification variants;
- authority-inconsistency reasons must match the decision rule.

A mismatch returns `assessment_integrity_failed`, a typed non-projectable outcome. This is runtime contract validation, not semantic inference. No request identity resolution, group merging, or resource classification was added to the executor.

## Verification

- `node scripts/audits/audit-phase1590-runtime-assessment-integrity.cjs`: structural checks only.
- Phase 1589 audit is also run to detect regressions in prior proof-input binding.
- Package build remains unverified when `tsdown`/project dependencies are unavailable.
- End-to-end authority cutover remains open: the default `routeManifestTypeLowering.ts` still uses `requestTypeDerivationProjectionPipeline`, and a real proof-producing semantic pipeline must be connected before that path can be replaced safely.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- MLIR Generic Transformation with Interfaces: https://mlir.llvm.org/docs/Tutorials/Toy/Ch-4/
- TypeScript Narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

These references support generic interface-driven analysis and typed variant handling. They do not establish that RouteSync's runtime proof is valid; RouteSync must validate its own proof contract.
