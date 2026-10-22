# Phase 1461 — Match Expression Interface First

## Boundary decision

This phase adds only the public contract for PHP `match` expression structural reasoning. It intentionally does not add an algebra implementation and does not alter scanner runtime wiring.

The intended pipeline is:

`source token evidence → typed match-structure knowledge → match judgment algebra → closed judgment → ScannerMatchExpressionInterface → runtime wiring → AST projection`

## Contract obligations for the future algebra

- Preserve source token objects and partitions; do not construct AST nodes.
- Resolve the `match` keyword, subject delimiters and partition, body delimiters, arm partitions, condition partitions, `=>` evidence, values, and trailing tokens as one closed result.
- Treat `default` as a typed arm identity, not as an untyped classification flag.
- Return explicit malformed judgments for absent subject/body/arm/arrow/value, mismatched delimiters, duplicate `default`, and `default` with conditions.
- Reuse `scannerTokenStructureInterface` for delimiter validation and top-level separator/operator evidence. Do not create another delimiter-depth loop.
- Keep source spellings (`match`, `(`, `=>`, `default`) as lexical evidence only. Judgment tags and semantic arm identities use `unique symbol` types.
- Keep AST node construction, runtime dispatch, and projection outside the interface and algebra.

## Current trace findings

`astClassifierRuntime.ts` currently owns `classifyMatch`, `parseMatchArms`, and a local `splitTopLevel` helper. The path locates parentheses and braces, partitions arm commas, searches for `=>`, and recognizes `default` while constructing AST arms. This mixes source-structure reasoning and AST projection in runtime. Phase 1461 does not wire the new contract into that path; wiring is explicitly deferred until the interface has been reviewed and the algebra has a complete contract test suite.

## Validation scope

This phase should be audited for the interface boundary and export only. It does not claim runtime behavior has changed or that match expressions now consume this contract.
