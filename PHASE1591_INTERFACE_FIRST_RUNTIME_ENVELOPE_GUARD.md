# Phase 1591 — Interface-First Runtime Envelope Guard

## Objective

Strengthen the runtime executor's trust boundary without moving semantic reasoning into runtime control flow.

## Trace

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` defines the source-bound input, judgment/proof ADTs, semantic authority assessment, and the pipeline interface.
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts` is the runtime trust boundary. It receives the assessment from the injected pipeline, validates the runtime envelope before dereferencing nested proof fields, binds proof premises to the submitted evidence, validates correlated proof invariants, then dispatches the already-derived judgment to the consumer.
- `packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts` preserves shape failures as non-projectable outcomes.
- `packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts` still uses `requestTypeDerivationProjectionPipeline` by default. This remains a legacy semantic path and is not represented as cut over.

## Change

The pipeline result is treated as `unknown` at the runtime boundary and checked for an assessment envelope before any nested access. The guard checks the assessment/decision correlation, proof premise object shape, source-domain arrays, and presence of judgment, verification, and coverage records. It returns `assessment_shape_invalid` for malformed values. The existing semantic-integrity validator then checks rule IDs, judgment kinds, verification kinds, law coverage, and contract binding.

This is intentionally two-stage validation:

1. Envelope validation prevents malformed runtime/plugin values from crashing the executor during nested property access.
2. Semantic proof validation checks the meaning and internal coherence of a structurally valid assessment.

Neither stage derives request semantics. The semantic pipeline remains the sole source of the judgment.

## Audit results

- Phase 1590 audit: 7/7 structural checks pass.
- Phase 1591 audit: 7/7 structural checks pass.
- TypeScript build: not verified; `tsdown` is unavailable in this environment and dependencies are not installed.

## Known remaining blocker

The default `routeManifestTypeLowering.ts` still invokes `requestTypeDerivationProjectionPipeline.derive(...)`, whose solver performs request/resource resolution and contribution aggregation. The authority-backed path is injectable but is not yet the default composition. A proof-producing semantic pipeline and verifier must be composed from actual upstream reasoning and law verification, then wired into the default composition root. Do not fabricate proof values or silently fall back when verification fails.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic compiler analyses and transformations query behavior through interfaces rather than encoding concrete operation knowledge.
- MLIR generic transformations: https://mlir.llvm.org/docs/Tutorials/Toy/Ch-4/ — interface-backed extensibility for generic transformations.
- TypeScript narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html — discriminated unions provide typed variant narrowing, but compile-time types do not validate untrusted runtime objects.
