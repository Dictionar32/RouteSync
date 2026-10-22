# Phase 2586 — Authority Integrity Gate Wiring

## Scope

This phase closes a concrete contract-to-implementation gap: the authority integrity gate existed and was exported, but the canonical semantic pipeline assembler did not invoke it. The previous pipeline called `authority.evaluate(input, candidate)` directly after decision assembly.

## Change

1. `RequestTypeDerivationSemanticPipelineCompositionInterface` now requires the existing `RequestTypeDerivationSemanticAuthorityIntegrityInterface` as an explicit capability.
2. The canonical assembler includes `integrity.contract` in the same-contract check and rejects a mismatched integrity capability before exposing a pipeline.
3. The assembler invokes `createRequestTypeDerivationAuthorityIntegrityGate` with the authority and integrity capability. It passes the original invocation input, candidate, and verifier envelope to the gate.
4. A rejected witness is represented by the closed `integrity_rejected` pipeline result. It is not converted into an authority assessment.
5. Upstream operation preparation propagates this as `authority_integrity_failed`; manifest lowering treats it as non-projectable.
6. The public core entry exports the new closed derivation result ADT. Type-level contract tests were updated to acknowledge the additional result variant.

## Actual path after this phase

`semantic composition -> contract identity checks -> reasoning -> proof verifier -> decision candidate -> authority integrity gate -> authority evaluation only if valid -> assessment validation -> judgment projection -> manifest lowering`

The gate checks correlation only. It does not implement the missing semantic reasoning producer or the complete independent verifier for the canonical law contract.

## Laravel source-discovery constraint

Laravel documents that route files are loaded through the application's `bootstrap/app.php` routing configuration, and additional route groups may be registered through the `withRouting(..., then: ...)` callback. The inventory/source-acquisition contract must therefore retain configured route-file provenance and cannot assume that `routes/api.php` is always present or is the only route source. Official reference: https://laravel.com/framework/docs/13.x/routing

## Remaining blockers

- No complete production `RequestTypeDerivationSemanticReasoningInterface` + independent full-law verifier + decision + authority composition has been found in the production composition root.
- The CLI executable still has no production composition supplied to `createProgram()`.
- The active legacy manifest lowering path still needs a separately validated cutover; this phase does not claim that it now consumes the new pipeline end-to-end.
- Full typecheck, package build, Vitest, and CLI end-to-end tests were not run in this environment.

## Validation

Run:

```sh
node scripts/audits/audit-phase2586-authority-integrity-gate-wiring.cjs
node scripts/audits/audit-phase2585-upstream-authority-integrity-export.cjs
node scripts/audits/audit-phase2584-cli-manifest-upstream-end-to-end-trace.cjs
```

These are structural source audits, not substitutes for TypeScript/Vitest/CLI end-to-end validation.
