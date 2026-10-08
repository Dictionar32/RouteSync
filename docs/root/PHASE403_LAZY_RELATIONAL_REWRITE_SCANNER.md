# Phase 403 — Lazy Relational Rewrite Scanner

Phase 403 raises scanner/resolver dispatch from eager imperative selection to a lazy semantic rewrite relation.

## Canonical model

`syntax evidence -> candidate relation -> requirements -> selected witness -> lazy rewrite -> canonical semantic value`

`solveRewriteCandidate` stores the rewrite as a thunk. Candidate selection therefore happens before the corresponding AST rewrite is evaluated. This avoids encoding source-control dispatch as the semantic authority.

## Applied migration

`resourceUpstreamExpressionCanonical.ts` migrated anonymous-class-member dispatch from `switch` to lazy rewrite candidates. Property/method construction is now selected by semantic requirements and evaluated only for the selected witness.

Raw PHP syntax remains evidence at the scanner boundary. It is not promoted to semantic control authority.

## Research basis

MLIR PDLL/PDL explicitly separates match constraints from rewrites and represents rewrite patterns as IR. MLIR DRR similarly defines source patterns, result patterns, and additional constraints declaratively. egglog combines equality saturation with Datalog, supporting a relation/rule based execution model.

## Validation

- TypeScript parser diagnostics: 0 for modified files.
- Full `tsc --noEmit`: environment-blocked by missing `node` and `vitest/globals` type definitions.
- Repository remains incremental: remaining scanner/resolver leakage is tracked rather than hidden by lexical obfuscation.
