# Phase 1661 — Invocation Witness Domain Identity

## Motivation

`InvocationSemanticDerivationWitness.ordinal?: number` leaked positional execution metadata into a semantic proof witness. Argument/parameter correspondence is already represented by domain identities, so the witness does not need a numeric ordinal.

## Changes

- Removed `ordinal?: number` from `InvocationSemanticDerivationWitness`.
- Removed the ordinal parameter and serialization branch from the witness builder.
- Argument-binding witnesses now carry argument and parameter identities only.
- Unmatched-argument witnesses carry the argument identity only.
- Bumped `InvocationSemanticContract.version` from 16 to 17.
- Updated the interprocedural contract test and added an architecture audit.

## Verification

- Phase 1661 witness-domain audit: 6/6 passed.
- Phase 1660 direct-judgment audit: 7/7 passed.
- Full build and Vitest were not run in this workspace; dependencies are not installed.

## Scope note

Numeric argument positions remain internal to positional argument-binding derivation, where array position is the source-language semantic relation being analyzed. They are not copied into the derivation witness as proof identity. Trace aggregate counters remain diagnostic counts, not proof premises.
