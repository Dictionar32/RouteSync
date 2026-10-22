# Phase 1602 — Interface Verification Binding Audit

## Scope

Interface-only change in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` plus a focused type-contract test. No scanner wiring, producer, verifier implementation, runtime executor, or downstream projection was changed.

## Contract gap closed

Previously, `RequestTypeDerivationProofVerificationInterface.verify(inference)` returned a free-standing `RequestTypeDerivationVerification`. Decision premises could therefore pair an inference packet from invocation A with a verification result from invocation B while remaining structurally well-typed.

The interface now defines `RequestTypeDerivationSemanticVerificationFor<TContract, TInference>`, carrying the contract, exact inference packet type, and verification result. `verify` is generic over the concrete inference packet and returns the envelope parameterized by that packet. Decision premises are generic over the same `TInference` and require the matching envelope.

## Boundary and limitation

The generic binding prevents accidental cross-pairing at the TypeScript type boundary when the concrete inference type is preserved. TypeScript cannot prove runtime object identity or value equality. The eventual verifier/assembler must preserve the same inference object/value and check contract value equality; this phase intentionally does not implement that runtime behavior.

## Validation

- Source-level structural checks: performed.
- Full TypeScript type-check: not run; workspace dependency executables are not available.
- Vitest: not run; local Vitest executable is unavailable.
- Package build: not run; local `tsdown` executable is unavailable.
