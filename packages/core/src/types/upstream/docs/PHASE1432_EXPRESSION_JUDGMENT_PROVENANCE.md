# Phase 1432 — Expression judgment provenance

## Intent

Evolve the existing expression candidate and structure contracts in place. Do not add a parallel expression ADT.

## Changes

- Candidate arbitration now returns an ordered attempt trail. Every evaluated candidate is marked `rejected` or `selected`; a successful result also carries the selected priority.
- `ExpressionStructureJudgment` now models a closed structured/not-structured/contract-violation result. Successful judgments retain the rule identity and original source-token evidence; unsuccessful judgments retain rejected rule identities.
- `astClassifierRuntime.ts` converts the candidate algebra result into the upstream judgment before AST projection. The projector consumes the resolved structure; it does not rerun candidate arbitration.
- The upstream barrel exports the attempt contract.

## Remaining boundary

This phase does not claim that all PHP syntax recognition has moved out of the scanner. The scanner still gathers PHP-specific evidence and provides candidate resolvers; malformed syntax checks and some expression-shape discovery remain in language adapters. The next migration should move declarative operator/form constraints into upstream policy contracts while keeping token acquisition and AST construction language-specific.

## Verification

Run `node scripts/audits/audit-phase1432-expression-judgment-provenance.cjs`, the existing candidate-algebra tests, and the workspace build. Static audit success is not a substitute for the test suite or build.
