# Phase 1890 — Invocation V2 Provenance-Closed Inventory Interface First

## Trace finding

Phase 1889 introduced a source-subject projection returning `SourceFile` directly. That type retained the domain identity but erased which source-binding evidence owned the identity. The V2 inventory receipt also needed to avoid parallel arrays of judgments and projected subjects, because independent arrays could drift out of correspondence.

## Interface correction

- `LaravelControllerInvocationSemanticJudgmentV2SourceSubjectJudgment` is a four-outcome discriminated union.
- The not-connected variant retains the exact not-connected V2 judgment and explicit controller source subject.
- The rejected variant retains the exact different-source identity judgment and its controller endpoint ownership.
- Complete and blocked variants retain the exact same-source identity judgment from the closed binding.
- `LaravelControllerInvocationSemanticJudgmentV2InventoryCorrespondence` pairs one exact V2 judgment with its provenance-bearing subject projection. The receipt uses correspondence entries, not parallel judgment and subject arrays.
- New types are exported from the core public type barrel.

## Runtime boundary

No source-subject projection implementation, V2 inventory authority implementation, authority migration, or Laravel scanner wiring is introduced. The current V1 authority, V1 inventory authority, and scanner remain unchanged. `packages/core/src/semantic/foundation` remains unused.

## Validation

The phase audit checks the four typed subject outcomes, provenance retention, correspondence pairing, public exports, and non-wiring of the runtime scanner. It is a static audit only; TypeScript compilation and full build are not claimed.

Static audit result: 204/204 checks passed across the retained Phase 1874–1889 audits and the new Phase 1890 audit. `node --check` passed for the new audit and `package.json` parses as JSON. No TypeScript build or compiler run was performed.
