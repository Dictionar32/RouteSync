# Phase 2682 — Semantic Producer Runtime Wiring

## Root cause addressed

The in-repository named runtime composition previously declared `decision`, `authority`, and `integrity` as placeholders that always threw `RequestTypeDerivationSemanticProducerGapError`. That meant the typed interface existed, but the runtime composition did not implement the contract.

## Changes

- Added `requestTypeDerivationSemanticDecision.ts`: constructs a closed decision proof from the exact inference packet, verification envelope, and contract-coverage evidence. Derived, incomplete, conflict, rejected input, verification failure, rejection verification failure, coverage failure, and inconsistent witness cases remain distinct proof variants. Partial law verification is never promoted to a verified derivation.
- Added `requestTypeDerivationSemanticAuthority.ts`: checks source and contract binding and validates decision/proof coherence before returning the corresponding closed assessment. It does not re-run reasoning.
- Rewired `requestTypeDerivationSemanticComposition.ts` to export the interface-typed `requestTypeDerivationSemanticComposition` backed by the concrete decision, authority, and existing witness-integrity implementation.
- Added Phase 2682 audit coverage from composition through assembler and CLI manifest preflight.

## Verification

- Phase 2680 runtime trace audit: 20/20 structural checks pass.
- Phase 2661 CLI fail-closed audit: 6/6 structural checks pass.
- Phase 2682 semantic producer/runtime wiring audit: see execution output.

## Explicit limitations

The semantic decision/authority placeholder gap has been replaced with executable implementations, but this does not make the whole derivation production-complete. The existing verifier deliberately returns `verification_incomplete` for law slices it cannot independently prove; the new decision algebra preserves that limitation as `authority_inconsistent`, never as success. `scan`/`sync` integration, TypeScript compilation, and Vitest were not executable in this extracted workspace because project dependencies (`node_modules`, Node/Vitest type definitions, project-local TypeScript 7 toolchain) are absent. The installed global TypeScript compiler is older than the repository's configured compiler and cannot serve as a valid project typecheck.
