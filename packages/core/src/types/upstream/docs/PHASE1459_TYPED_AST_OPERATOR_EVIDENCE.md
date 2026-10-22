# Phase 1459 — Typed AST Operator Evidence

## Scope

This phase migrates runtime operator searches for match-arm `=>`, inline-array `=>`, and collection `as` to a typed upstream operator-evidence contract. The `instanceof` candidate path also consumes that contract. The lexical spelling remains source-token evidence; semantic operator identity and evidence-judgment variants use unique-symbol identities.

## Pipeline

Source token evidence → typed operator vocabulary → structural occurrence evidence → closed operator judgment → runtime wiring → AST projection.

## Contract behavior

- A resolved judgment carries the typed operator descriptor and complete `before`/`token`/`after` partition.
- Not-found and malformed source are separate outcomes.
- Malformed delimiter evidence is forwarded from the structural authority.
- Duplicate semantic operator identities in a vocabulary are rejected.
- Runtime no longer owns a generic string-target `findTopLevelOperatorEvidence` helper.

## Remaining work

- Assignment operator vocabulary still uses lexical spelling collections and requires its own typed operator contract migration.
- `scannerExpressionOperatorAlgebra.ts` still represents precedence as numeric tiers and token spellings as strings; this is a separate, larger semantic-precedence migration and is not claimed complete here.
- Other runtime structural helpers (`indexOf`, `splitTopLevel`, delimiter traversal) remain to be traced by consumer before moving them.
- Full build and Vitest execution must be run in a workspace with dependencies installed.
