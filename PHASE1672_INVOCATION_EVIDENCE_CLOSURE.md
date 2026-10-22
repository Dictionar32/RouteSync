# Phase 1672 — Invocation Evidence Closure

## Scope

Interface-first refinement only. This phase updates `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`, adds a focused static audit and a TypeScript type assertion fixture, and records the contract boundary. No algebra, authority, runtime executor, scanner, or downstream wiring was changed.

## Contract changes

- Advanced `InvocationSemanticModel` from version 14 to 15 and `InvocationSemanticContract` from version 25 to 26.
- Added `InvocationSemanticEvidence`, a non-empty tuple of `SemanticSource` records.
- Strengthened argument binding claims and outcomes so the overall judgment evidence, per-disposition evidence, and the argument/parameter/correspondence evidence components cannot be represented as empty arrays.
- Updated the semantic provenance invariant to explicitly require non-empty, claim-specific source evidence.

## Verification

- Phase 1672 static contract audit: 14/14 checks passed.
- Focused strict TypeScript check for the interface and type assertion fixture passed.
- The type fixture verifies that an empty tuple is not assignable to `InvocationSemanticEvidence` and that a one-source tuple is accepted.
- ZIP integrity and `RouteSync/` root are checked after packaging.
- Full repository build/tests are not claimed.

## Remaining authority responsibilities

A non-empty source list is not proof that the source is authentic or semantically sufficient. The future authority must verify that evidence actually supports each claim, invocation identities align with the enclosing judgment, and the ordered argument disposition ledger exactly covers the invocation arguments without loss or duplication. This phase intentionally leaves those value-level checks and runtime wiring unchanged.
