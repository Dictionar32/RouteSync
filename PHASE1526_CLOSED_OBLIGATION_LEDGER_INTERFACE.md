# Phase 1526 — Closed Obligation Ledger Interface

## Scope

This phase changes the semantic type model and public type exports only. It does not change runtime reasoning, evaluator functions, or scanner behavior.

## Interface model changes

- Adds typed evidence anchors: source span, authoritative rule declaration, or nested query judgment.
- Adds a closed obligation receipt algebra: `satisfied`, `violated`, or `unproven`.
- Adds a rule-family-indexed obligation ledger whose mapped keys cover every required premise and constraint for that family.
- Adds a closed derivation-judgment algebra:
  - `resolved` carries only satisfied obligation receipts;
  - `malformed` carries evaluated receipts and a diagnostic;
  - `undetermined` retains the full ledger including unproven obligations.
- Exports the new interface types from the core package entry point.

## Boundary statement

The new judgment types define the target contract for semantic reasoning. Existing runtime evaluators do not yet produce these ledgers, so this phase does not claim runtime proof enforcement. The scanner and reasoning implementations were deliberately left unchanged to keep this phase interface-first.

## Verification

- Phase 1526 static interface audit: 8/8 checks passed.
- Phase 1525 interface audit: passed.
- Phase 1522 decision-contract audit: passed.
- Full build: blocked because `tsdown` is not installed in the workspace.
- Full type-check: blocked by the available global TypeScript/compiler environment and missing project type definitions (`node`, `vitest/globals`).
