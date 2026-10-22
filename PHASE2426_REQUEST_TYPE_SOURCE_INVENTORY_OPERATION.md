# Phase 2426 — RequestType Source Evidence Inventory Operation

## Changes applied to the Phase 2425 workspace

- Added `RequestTypeDerivationSourceEvidenceInventoryInterface` to the existing upstream RequestType derivation contract.
- Added `requestTypeDerivationSourceEvidenceInventory.ts` in the existing semantic owner. It produces the already-defined route/resource/request evidence-reference ADTs from the canonical input.
- Route occurrences preserve the original `declarationSpan`; resource and request occurrences preserve their AST `SourceSpan`.
- Occurrence keys are derived from source file and exact start/end offsets, not array order or object identity.
- The operation imports neither `semantic/relations` nor `semantic/foundation`, and it does not claim to create a judgment or proof.

## Validation performed

- `node scripts/audits/audit-phase2426-request-type-source-inventory.cjs`: PASS 8/8 assertions.
- TypeScript `transpileModule` syntax check: PASS 2/2 changed TypeScript files, zero syntax diagnostics.
- Focused TypeScript check with the installed TypeScript 5.8.3: not clean; 61 diagnostics in existing transitive project files. None of the reported diagnostics names the new inventory implementation or the edited upstream RequestType contract.
- Full project `tsc --noEmit`: blocked by the repository's TypeScript 7 target/lib settings unsupported by the installed TypeScript 5.8.3, plus pre-existing syntax diagnostics in `effectiveControllerActionPolicyResolver.phase921.test.ts`.
- Package build, Vitest, and live CLI integration were not run.

## Important limitation — not a closure claim

This phase adds the source-inventory operation needed by the semantic producer, but it does **not** implement the missing proof-producing RequestType reasoning/verifier/decision/authority composition. The active `routeManifestTypeLowering.ts` still calls `requestTypeDerivationProjectionPipeline.derive(...)`. The active CLI chain is therefore not yet interface-first end-to-end. Do not treat this phase as fixing the Phase 2425 blocker or as validated RequestType semantic closure.

## Next required work

Implement source reasoning that produces a closed judgment and complete receipts, independently verify every law in `REQUEST_TYPE_DERIVATION_LAW_IDS`, compose the existing reasoning/verifier/decision/authority interfaces with one canonical contract instance, then wire the assembled pipeline into the active manifest/CLI path. Remove the legacy projection only after semantic and CLI regressions pass.
