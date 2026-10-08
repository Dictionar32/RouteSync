# Phase 425 — Scanner Lexer Relational Predicate Cutover

Baseline: Phase 423

## Scope

Cut over remaining host-language conjunction predicates in `astClassifierEvidence.ts` to the semantic relation kernel. PHP operator spellings remain token vocabulary and are not treated as implementation operators.

## Changes

- Replaced scanner predicate `&&` composition with `relationAll` across compound token-shape checks.
- Replaced host ternary used for assignment-target selection with `relationGate`.
- Replaced conjunctions in operator discovery, anonymous-class discovery, matching delimiters, assignment targets, and statement boundaries with relation predicates.
- Preserved PHP token vocabulary such as `&&`, `||`, `??`, `===` where these strings describe source-language tokens.
- No broad textual codemod across unrelated files.

## Validation

`astClassifierEvidence.ts` TypeScript `transpileModule`: 0 diagnostics.
