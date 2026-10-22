# Phase 2559 — Route Occurrence Identity Bound to Original Input

## Root cause found

The source-occurrence guard checked a route's canonical semantic key and declaration span against the original input, but it did not compare the route's `sourceFile` and `sourceLine` provenance fields. The evidence's own location could therefore agree with its own provenance while the corresponding input route differed in these provenance coordinates.

## Source fix

`packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts`

The route branch of `sourceCoordinatesMatchInput` now compares:

- canonical route semantic identity;
- `sourceFile`;
- `sourceLine`;
- declaration-span file, start, and end.

This is an upstream evidence/identity correction. It does not create a new identity system, infer a semantic judgment, or promote a partial verifier into a complete 32-law verifier.

## Active path retained

`CLI scan/sync → required semantic pipeline → source manifest → canonical evidence inventory → request/resource resolution preflight → authority-backed projection → judgment consumer`.

The concrete production reasoning/verifier/decision/authority composition remains absent. The CLI therefore continues to fail closed when no pipeline is supplied; this phase does not claim to solve that separate root cause.

## Validation

Run `node scripts/audits/audit-phase2559-route-occurrence-input-identity.cjs` and the existing Phase 2552–2558 structural audits. These are structural assertions, not a full TypeScript build or end-to-end proof verification.
