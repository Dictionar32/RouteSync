# RouteSync Phase 2647 — Inference Default Requires Prepared Input

## Root cause

The previous phase changed the downstream reasoning/verifier/decision/authority/pipeline defaults to use `RequestTypeDerivationSemanticInputPreparation`, but the base `RequestTypeDerivationSemanticInferenceFor` generic still defaulted `TInput` to raw `RequestTypeDerivationInput`. That left the foundational inference packet contract weaker than the capabilities built on it and allowed default inference declarations to silently omit the inventory and resolution-ledger surface.

## Implementation

- Changed the base inference packet's default `TInput` to `RequestTypeDerivationSemanticInputPreparation` while retaining `RequestTypeDerivationInput` as its constraint for explicit specializations.
- Updated the Phase 2646 structural audit so it checks the foundational default instead of incorrectly accepting the raw-input default.
- Added `audit:phase2647-inference-default-prepared-input`, which checks the base type, the reasoning/pipeline input correlation, upstream preparation ownership, absence of a legacy solver fallback in the preparation/assembler path, and absence of `semantic/foundation` dependencies.

## Intended flow

`Manifest → RequestTypeDerivationInput → Semantic Preparation Packet → Contract-bound Inference → Independent Verification → Decision → Authority → Pipeline → Manifest Projection`

## Validation

- Phase 2646 audit: 9/9 assertions passed after tightening its foundational-default assertion.
- Phase 2647 audit: run separately; its result is recorded in the accompanying execution report.
- Full TypeScript build/typecheck and Vitest are not claimed as passed. The workspace has no installed `node_modules`; earlier global `tsc` invocation was incompatible with this project's TypeScript configuration.

## Explicitly not solved

This change strengthens the default contract only. It does not implement the missing concrete semantic reasoning producer or the complete independent verifier for all canonical laws. Production composition must remain fail-closed until those capabilities actually exist and are wired.
