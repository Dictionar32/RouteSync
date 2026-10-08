# Phase 370 — Relational Authority Eradication Gate

Phase 370 tightens the semantic authority boundary after the evidence-relation cutover.

## Architectural basis

The direction is consistent with established declarative semantic systems:

- WebAssembly specifies validation as declarative constraints and execution as reduction rules.
- MLIR DRR/PDLL separates matching, constraints, and rewriting.
- Souffle treats analysis state as typed relations.
- egglog combines equality saturation with Datalog-style relational reasoning.
- K expresses program semantics through rewrite rules.

RouteSync does not copy these implementations. It adopts the common architectural property: source syntax is evidence; semantic meaning is derived by relations, constraints, rewrites, and fixed-point closure.

## Authority set

The Phase 370 gate covers the canonical semantic authority files:

- `semanticConstructRelations.ts`
- `semanticEvidenceRelations.ts`
- `semanticRelations.ts`
- `semanticUnknownRelations.ts`
- `parserAdapterRelations.ts`
- `semanticRelationSolver.ts`
- `routeAst/syntaxErrorRelationCore.ts`
- `ternaryHandler.ts`
- canonical `astClassifier.ts`
- canonical `queryProducer.ts`

The gate is AST-based and rejects implementation constructs, not source-language strings. Therefore PHP facts such as the token names `if`, `null`, or `unknown` are not falsely classified as host-language control flow or TypeScript escape hatches.

## Eliminated from the authority set

The gate requires zero occurrences of:

- host `if`, `for`, `while`, `switch`
- collection `.map()`, `.filter()`, `.reduce()`, `.flatMap()`
- host `undefined`
- host `null`
- strict equality operators `===` and `!==`
- TypeScript `as` assertions
- TypeScript `unknown` type syntax

The implementation vocabulary remains relation-oriented: candidate selection, presence witnesses, equality relations, requirement solving, relation execution plans, rewrite rules, and fixed-point saturation.

## Important semantic distinction

PHP `null` is source data and must remain representable as a tagged semantic atom. The prohibition is on using JavaScript/TypeScript `null` as a semantic absence sentinel. Absence is represented through presence relations.

Likewise, semantic unresolved/unknown states are domain facts; the forbidden item is the TypeScript `unknown` escape-hatch type in the semantic authority.

## Validation

`scripts/audit-phase370-relational-authority.cjs` parses TypeScript syntax with the TypeScript compiler API and reported zero violations across the authority set.

The root TypeScript configuration could not be type-checked in this workspace because the required `node` and `vitest/globals` type-definition packages are not installed. This is an environment limitation, not a claimed compile pass.
