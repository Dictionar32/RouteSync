# RouteSync Phase2420 — RequestType Coverage Operation Closure

## Purpose

Continue the Phase2419 trace by closing one missing explicit operation beneath RequestType semantic authority, without fabricating the missing source reasoning producer.

## Root finding

`RequestTypeAuthorityCoverageEvidence` and `RequestTypeAuthorityCoverageEvidenceFor<TContract>` already model contract coverage, but the operation that produces that witness was implicit inside `createRequestTypeDerivationAuthority` as duplicate law-coverage checks. This obscured a distinct operation required by semantic decision composition.

## Changes

1. Added `RequestTypeDerivationAuthorityCoverageInterface` beside the existing upstream coverage ADT in `requestTypeDerivationInterface.ts`.
2. Added `createRequestTypeDerivationAuthorityCoverage` in the semantic RequestType derivation owner. It consumes the existing contract and verification ADTs and produces one existing coverage variant: `contract_incomplete`, `verification_incomplete`, or `complete`.
3. Refactored `createRequestTypeDerivationAuthority` to consume this operation. Authority outcomes remain unchanged: incomplete coverage is preserved as `authority_inconsistent` with the corresponding reason.
4. The new operation uses the canonical `REQUEST_TYPE_DERIVATION_LAW_IDS`; it creates no parallel law list, does not derive or repair judgments, and does not import `semantic/relations` or `semantic/foundation`.

## Verification

- Phase2420 operation audit: 12/12 assertions passed.
- TypeScript syntax transpilation of the three changed files: 3/3, zero syntax diagnostics.
- Phase2419 active manifest audit rerun: 13/13 assertions passed.

These checks do not constitute a full project typecheck, test run, build, or live CLI execution; those were not run because workspace dependencies are unavailable.

## Remaining blocker — not misrepresented as closed

The active `routeManifestTypeLowering.ts` still invokes `requestTypeDerivationProjectionPipeline.derive(...)`. `createAuthorityBackedRouteManifestProjection` remains unwired to the active manifest/CLI path, and there is still no concrete producer implementing `RequestTypeDerivationSemanticPipelineInterface` in `packages/core/src`.

The next semantic implementation must provide actual source-evidence reasoning, proof verification, closed decision composition, and authority assessment using the existing contracts. Reusing the legacy `requestTypeDerivationSolver.ts` as if it already emitted the proof ledger would be incorrect: it returns projected `RequestType[]`, imports `semantic/relations`, and does not produce `RequestTypeDerivationJudgment` with the required closure receipts. This phase intentionally does not pretend otherwise.

## Technical reference

TypeScript's official Handbook documents discriminated unions and exhaustive handling as techniques for preserving distinct states across typed boundaries: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
