# Phase 1460 — Typed expression precedence contract

## Migration boundary

This phase replaces numeric precedence tiers and string associativity labels in the upstream expression-root operator contract with typed semantic identities and explicit precedence relations.

## Ownership flow

`source token evidence → ScannerExpressionOperatorInterface → scannerExpressionOperatorAlgebra → closed operator judgment → PHP adapter wiring → expression AST projection`

## Contract guarantees

- Precedence tiers are unique-symbol identities, not numeric ranks.
- Associativity and operator judgment variants are unique-symbol identities.
- Source lexical spelling remains text evidence; it is not the semantic identity of a precedence tier.
- The algebra rejects duplicate spellings, conflicting associativity within a tier, unknown tiers, cycles, and incomparable precedence tiers.
- A resolved judgment carries the selected operator, its source token, and the before/after partitions.
- Root selection uses the typed weaker-than relation. Same-tier association selects the first source occurrence for right association and the last for left association.

## Scope limits

This phase does not claim that every scanner runtime helper has been migrated. `splitTopLevel`, match-arm decomposition, and several delimiter helpers remain follow-up work. Lexical source strings and implementation-level collection traversal remain valid where they represent source data or traversal mechanics, not semantic identity.

## Verification

Run `node scripts/audits/audit-phase1460-typed-expression-precedence-contract.cjs`. The focused Vitest suite is updated but must be executed in an environment with the workspace test dependencies installed. Full build status must be reported separately.
