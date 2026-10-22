# Phase 1710 — Static Aggregate Judgment Interface

## Scope

Interface-first only. This phase closes the **shape** of a static invocation aggregate judgment over target resolution, argument binding, effects, proof receipt, and unresolved obligations. It does not implement static invocation algebra, authority validation, runtime execution, or production wiring.

## Trace finding

Previous phases defined static target resolution, argument-binding, and effect-projection subjudgments, but no single result contract required those subjudgments to correlate into one static invocation judgment. The coverage inventory also described the static judgment contract as not yet defined even though subcontracts existed. This phase closes that model gap while explicitly keeping runtime coverage marked unsupported.

## Changes

- Added `InvocationStaticSemanticJudgment` with `closed` and `incomplete` variants.
- Closed results require a unique target, `not-required` or `established` binding, projected effects, no obligations, and a closed proof receipt.
- Incomplete results require a non-empty obligation ledger and an incomplete proof receipt.
- Added static-specific obligations for unresolved/ambiguous targets, unproven argument form, and unmatched parameters.
- Added rule-owned proof witness and receipt types. Closed proof requires the canonical source → target → binding → effects → closure witness order.
- Added `InvocationStaticSemanticJudgmentContract` and attached it to the static model and coverage contracts.
- Corrected coverage inventory wording: the contract model exists, but static algebra and authority are still not implemented.
- Bumped static model to version 4, coverage to version 4, and pipeline contract to version 17.
- Exported the aggregate judgment and proof types from `packages/core/src/index.ts`.
- Strengthened the Laravel controller scanner semantic boundary to version 3: scanner remains source-artifact-only, and the wiring gate explicitly waits for static judgment algebra and authority implementation plus validation.
- Production wiring is untouched.

## Architectural invariants

- Static invocation remains distinct from ordinary invocation; no receiver is invented.
- Subject identity must correlate across all subjudgments, proof witnesses, and obligations.
- Unresolved evidence cannot be dropped while aggregating a judgment.
- Only authority validation can certify that a proof receipt and closure are valid.
- This phase defines the contract shape; it does not claim the static judgment executes at runtime.

## Verification

Run `npm run audit:phase1710-static-aggregate-judgment-interface`, plus the prior phase audits. Build/typecheck are reported separately and are not inferred from static audits.
