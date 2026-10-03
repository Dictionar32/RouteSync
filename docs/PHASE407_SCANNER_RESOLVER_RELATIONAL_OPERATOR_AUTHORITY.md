# Phase 407 — Scanner/Resolver Relational Operator Authority

Phase 407 continues the scanner/resolver authority migration from Phase 406.

## Scope

Production scanner/resolver targets:

- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`
- `packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts`

## Architectural change

Host-language equality/disjunction is no longer used as semantic authority in these targets. Equality is represented by `relationEqual`, and disjunction is represented by `relationAny`.

The migration is deliberately AST-structured rather than regex substitution. Source-language vocabulary such as the literal statement names `if` and `for` remains data because those strings describe the input PHP language; they are not host-language control flow.

The remaining `undefined`/`null` occurrences are treated as the next semantic-boundary migration: convert resolver return contracts from `T | undefined` to `RelationOption<T>` and consume them through relation folds. A sentinel rename would only hide the old architecture and is therefore not considered a completed migration.

## Research alignment

MLIR PDLL explicitly separates matching constraints from rewrite actions; PDL represents matcher/rewrite patterns as IR. JastAdd demonstrates declarative circular fixed-point evaluation for dataflow/reachability. These reinforce the RouteSync direction of facts → constraints → candidate → rewrite/witness rather than procedural control as semantic authority.

## Validation

- TypeScript source parse diagnostics: 0 for both modified targets.
- Exact lexical audit: no host-language `===` or `||` operators remain in either target. Remaining textual `===`/`||` occurrences are source-language token vocabulary where applicable.
- Repository-wide `tsc --noEmit` remains environment-blocked by unavailable `node` and `vitest/globals` type definitions.

## Next frontier

1. `queryEvidenceProducer.ts`: complete `undefined`/`null` → `RelationOption` migration.
2. `astClassifierEvidence.ts`: migrate classifier resolver contracts to `RelationOption` and make ternary resolution a candidate/constraint relation.
3. `ResourceScanner.ts` and remaining resolver adapters: remove procedural error/lookup authority and project semantic failure as relations.
