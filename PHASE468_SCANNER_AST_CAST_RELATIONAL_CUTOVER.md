# Phase 468 — Scanner AST cast relational cutover

- `classifyCast` now returns `RelationOption<PhpAstValue>` directly.
- Cast classification remains a candidate/constraint solve using the canonical requirement solver.
- The classifier rule catalog consumes the option directly instead of converting a nullable host result.
- PHP operator/token vocabulary remains data; source-language literals are not removed from lexical facts.
- This phase intentionally does not claim the entire `astClassifierEvidence.ts` file is clean; remaining classifier functions are the next migration frontier.
