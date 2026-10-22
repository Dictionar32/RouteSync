# Phase 2549 — CLI Resolution Ledger Consumption

## Root cause

The CLI computed and assessed a canonical request-resolution ledger before lowering, but the active RequestType solver independently called the request-resolution operation again. The solver could then turn `missing` and `ambiguous_*` outcomes into an empty relation option and silently omit a route contribution. The preflight ledger was therefore a gate, not the exact decision consumed by lowering.

## Source change

- The CLI passes the already-assessed request-resolution ledger with the manifest into the projection boundary.
- The projection and lowering interfaces bind the manifest and ledger in one typed input.
- The semantic projection input now requires the ledger.
- The solver joins each FormRequest route to exactly one receipt using the canonical source-occurrence key, then joins the selected Request AST using its canonical source-occurrence key.
- The solver no longer invokes the request-resolution operation itself.
- Missing/duplicate route receipts, missing/duplicate AST occurrences, or unresolved/ambiguous receipts fail closed instead of being converted to an empty option.
- The compatibility subscanner constructs the same ledger contract before calling the projection pipeline.

## Boundaries

This closes the duplicate request-resolution decision between CLI preflight and legacy projection. It does **not** complete the 32-law `RequestTypeDerivationJudgment` producer/verifier, does not remove `semantic/relations` from the legacy solver, and does not claim end-to-end interface-first RequestType derivation. No `derived` judgment is fabricated from `RequestType[]`.

## Verification

Run `npm run audit:phase2549-cli-resolution-ledger-consumption` and the Phase 2548 through Phase 2542 audits. Full package build and CLI end-to-end verification remain required before release.
