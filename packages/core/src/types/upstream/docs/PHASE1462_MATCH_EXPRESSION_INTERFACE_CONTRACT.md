# Phase 1462 — Match Expression Interface Contract Hardening

## Scope

This phase changes the interface boundary only. It does not implement the match algebra, migrate runtime wiring, simplify runtime helpers, or change downstream AST projection.

## Contract decisions

- `ScannerMatchExpressionQuery` explicitly receives `ScannerTokenStructureInterface` as its canonical structural-evidence dependency.
- A resolved conditional arm preserves condition partitions and the comma tokens between conditions.
- Each arm preserves the comma token following it when present, including a trailing comma as source evidence.
- Source malformedness and contract violations are separate closed judgments. Malformedness describes the input program; contract violation describes an impossible or incomplete algebra result/dependency outcome.
- The algebra must reuse the supplied structure authority for delimiter and top-level token evidence. It must not implement a second delimiter scanner.
- Token spelling remains lexical evidence. Semantic tags and contract-violation identities use `unique symbol` types.
- The interface owns neither scanning algorithms nor AST construction.

## Required invariants for the future algebra

1. A `resolved` result contains the keyword, paired subject delimiters, non-empty subject partition, body delimiters, ordered arm evidence, all condition separators, all present arm separators, and the untouched suffix.
2. Every conditional arm has at least one non-empty condition, exactly one fat-arrow evidence token, and a non-empty value partition.
3. A default arm has no condition partition and has exactly one default-token evidence item.
4. A source syntax failure returns `malformed` with source-backed location and a typed reason.
5. A result that violates the output shape or cannot rely on the structural authority returns `contract violation`, not `malformed`.
6. `not applicable` is reserved for input that is not a candidate match expression; it is not a fallback for malformed match syntax.

## Trace and migration order

`astClassifierRuntime.ts` still performs match grammar reasoning through `classifyMatch`, `parseMatchArms`, and `splitTopLevel`. No wiring is changed in this phase. The next phase must implement the algebra against these invariants and test valid/malformed partitions before any runtime migration.

## Validation boundary

This phase validates interface declarations and export visibility only. It does not claim the algebra, runtime wiring, AST projection, or full build has been verified.
