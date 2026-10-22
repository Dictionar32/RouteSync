# Phase 2575 — FormRequest Identity Witness Audit

## Root cause

`RequestTypeCanonicalRequestIdentity` already distinguishes `http_request_identity` from `form_request_identity`, and the FormRequest semantic key includes `formType`. However, `requestTypeDerivationSourceOccurrenceVerification.ts` only compared the request identity kind, request name, and semantic key. It did not compare the concrete `formType` field carried by the canonical identity witness against a freshly recomputed canonical identity.

That left a witness-integrity gap: a forged or stale canonical identity object could carry the correct semantic key while exposing a different `formType` field. The semantic key was not a substitute for checking every field in the closed identity ADT.

## Implementation

The request identity check now:

1. recomputes canonical identity from the source request identity;
2. checks common identity fields and the semantic key;
3. narrows the canonical identity ADT by `identityKind`;
4. for `form_request_identity`, explicitly compares the witness `formType` with the canonical `formType`;
5. returns `false` for a mismatch, allowing the verifier to reject the witness rather than repairing it or selecting a fallback.

No new interface was added. Existing `RequestTypeCanonicalRequestIdentity` remains the owner of the closed identity ADT. No legacy solver was wired into the active path, and no semantic foundation/relation dependency was added.

## CLI/manifest trace boundary

The active route remains:

`CLI scan/sync → injected semantic pipeline resolution → manifest composition authority → canonical source inventory → request/resource resolution → semantic pipeline → proof verification → authority-backed manifest projection`.

This phase fixes one evidence-witness consistency hole inside the existing upstream verifier. It does **not** implement the missing production reasoning capability or the complete independent verifier for all 32 derivation laws. The CLI continues to fail closed without a production composition.

## Validation performed

- Phase 2570 audit: 14/14 assertions.
- Phase 2571 audit: 13/13 assertions.
- Phase 2572 audit: 27/27 assertions.
- Phase 2573 audit: 16/16 assertions.
- Phase 2574 audit: 12/12 assertions.
- Phase 2575 audit: 12/12 assertions.
- Combined: 94/94 structural/syntax assertions across these six scripts.

The audit scripts use TypeScript `transpileModule` to check syntax of selected files. Full TypeScript typecheck, package build, Vitest, and CLI end-to-end were not run; these results must not be interpreted as a full build validation.

## Next root cause

The larger blocker remains production composition: no concrete production reasoning producer and independent verifier have been found that genuinely establish every law in `REQUEST_TYPE_DERIVATION_LAW_IDS`. Next work should trace each law to its input evidence and proof premise, implement the real producer/verifier upstream, then connect decision and authority through the existing assembler. Do not wrap the legacy `RequestType[]` solver as a verified judgment.
