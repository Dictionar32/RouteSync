# Phase 492 — Scanner/Lexer + Resolver Relational Cutover

## Scope

This phase continues the semantic-authority migration from Phase 491 at the scanner/lexer and resolver frontier.

The rule is: source-language vocabulary remains data, while host TypeScript control/absence/casting constructs are not allowed to become semantic authority.

## Cutover

### Lexer

- Quote dispatch in `tokenizer.ts` is resolved through the relation gate rather than a host conditional expression.
- Lexical transition selection remains catalog-driven and recursive.

### Scanner DTO parser

- Removed the type-level `never` escape from the primitive property catalog.
- Removed the explicit TypeScript cast used when reconstructing primitive property types.
- Absence remains represented by the relation option boundary.

### Resolver

`selectRawProjectionParser.ts` now keeps projection classification inside the relational boundary:

- aggregate discovery uses relation-option resolution;
- property existence uses relational absence/presence;
- aggregate row detection is relation-gated;
- textual projection slicing uses the relational text-slice primitive;
- alias extraction uses relation-gated presence;
- top-level SQL field scanning continues as recursive relation evaluation;
- strict host equality is not used as the semantic decision mechanism.

## Architecture

```text
source text
  -> lexical transition catalog
  -> token evidence
  -> syntax candidate relations
  -> relation gate / option closure
  -> semantic resolver candidates
  -> fixed-point / rewrite authority
```

This follows the same design direction as MLIR PDLL/PDL's declarative match/rewrite separation and egglog's combination of Datalog-style relations with equality saturation.

## Validation

The three touched TypeScript production files pass TypeScript syntax transpilation with zero diagnostics using the installed TypeScript compiler.

A repository-wide `tsc --noEmit` remains blocked by the existing environment dependency errors for `node` and `vitest/globals`; this phase does **not** claim repository-wide type-check success.

## Remaining frontier

The next scanner/lexer authority hotspot is `astClassifierEvidence.ts`, where host ternary expressions and legacy absence values still remain. Those must be converted to candidate/guard/option relations rather than mechanically renamed helpers.
