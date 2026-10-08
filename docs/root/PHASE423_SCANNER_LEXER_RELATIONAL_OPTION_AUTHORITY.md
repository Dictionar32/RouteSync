# Phase 423 — Scanner/Lexer Relational Option Authority

## Scope
Focused migration of `astClassifierEvidence.ts` binary-operator discovery.

## Change
`findBinaryOperator` no longer returns `T | undefined`. It returns the kernel `RelationOption<T>`, with absence represented as the relational `none` witness. The compound-expression rule consumes it through `relationOptionFold` and tests resolution through the relation kind.

This is intentionally not a token-vocabulary codemod: PHP spellings such as `===`, `&&`, and `||` remain data in the operator catalog. Their presence does not constitute TypeScript control/operator authority.

## Research basis
MLIR PDLL/PDL separates declarative matching from rewriting and represents patterns as IR; MLIR DRR expresses source/result patterns declaratively. Egglog combines equality saturation with Datalog, while JastAdd expresses circular fixed-point computation declaratively.

## Validation
The repository baseline has pre-existing TypeScript diagnostics unrelated to this focused change (including missing/legacy imports and type-contract issues in `astClassifierEvidence.ts`). Therefore this phase does not claim a clean repository-wide typecheck. The modified function is structurally relational and the archive is integrity-checked.
