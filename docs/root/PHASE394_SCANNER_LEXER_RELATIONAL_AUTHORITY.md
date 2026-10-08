# Phase 394 — Scanner/Lexer Relational Authority

## Scope

Phase 394 continues the Phase 393 scanner/resolver migration with a narrow, semantics-first change in `astClassifierEvidence.ts`.

## Changes

- Top-level AST classification now uses the existing relational selection/fold boundary rather than interpreting the first classifier through a host-language nullable comparison.
- Binary-expression fallback no longer uses the `undefined as unknown as PhpAstValue` escape hatch; the relation gate projects a supported binary witness or an explicit unsupported AST value.
- The migration keeps syntax evidence extraction separate from semantic candidate selection.
- No broad lexical codemod was applied to the remaining scanner because many occurrences are evidence-level token comparisons and blind replacement would risk changing PHP grammar recognition.

## Research basis

The design follows the same separation used by declarative rewrite systems: pattern matching produces candidates, constraints select valid candidates, and a separate rewrite/projection stage materializes the canonical result. MLIR PDLL explicitly separates match and rewrite sections and supports reusable constraints. JastAdd demonstrates declarative fixed-point computation for static analysis. egglog combines equality saturation with Datalog-style relational reasoning.

## Audit

Regex lexical audit over `packages/core/src/compiler/scanner/**/*.ts`:

- 492 TypeScript files
- 5,641 lexical-pattern occurrences in the top-level workspace representation
- largest remaining authority: `queryEvidenceProducer.ts` (777)
- `astClassifierEvidence.ts`: 324
- `controllerAstCanonical.ts`: 137
- `providerAstCanonical.ts`: 96
- `migrationProducer.ts`: 95
- `ResourceScanner.ts`: 93
- `resourceFieldProducer.ts`: 91
- `serviceAstCanonical.ts`: 88
- `resourceProducer.ts`: 86
- `requestProducer.ts`: 84
- `controllerMethodParser.ts`: 77

This is a lexical audit, not an AST-level proof of semantic authority.

## Validation

The targeted TypeScript check produced no diagnostics naming the modified classifier/controller parser files. The extracted checkpoint environment is still not a complete dependency/type environment, so this phase does not claim a repository-wide clean type check.

## Next frontier

The next high-value migrations remain `queryEvidenceProducer.ts`, `astClassifierEvidence.ts`'s remaining sentinel-returning classifier functions, `controllerAstCanonical.ts`, and resolver/resource scanner families. The intended end-state remains:

`syntax evidence → typed facts → candidate relations → constraints → fixed point → rewrite/equality saturation → canonical witness`.
