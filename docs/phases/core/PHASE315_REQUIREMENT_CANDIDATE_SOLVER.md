# Phase 315 — Requirement/Candidate Semantic Solver

Phase 315 establishes the next semantic layer above raw `relationChoose`: candidate selection is now represented as explicit semantic relations.

## New model

`semantic/kernel/requirementSolver.ts` defines:

- `SemanticCandidate<T>` — a semantic candidate with identity and value.
- `Requirement` — a positive condition attached to a candidate.
- `Exclusion` — a negative condition that invalidates a candidate.
- `Dependency` — a required availability relation.
- `candidateSatisfies` — recursive constraint evaluation.
- `solveCandidate` / `solveCandidateId` — relational candidate selection.

The solver evaluates requirements, exclusions, and dependencies before selecting a candidate. This makes the semantic authority a data relation rather than a handwritten branch chain.

## Migrations

The model is now used by:

- `semantic/plugins/frameworkRuleSelection.ts`
- `semantic/plugins/expression/ternaryHandler.ts`
- `compiler/scanner/lexer/astClassifier.ts`
  - cast classification
  - compound-expression precedence dispatch
  - function/callable dispatch
  - unary dispatch
  - structured-statement dispatch
  - simple-statement dispatch
- `compiler/scanner/subscanners/queryProducer.ts`
  - relation aggregate validation
  - ordering target/direction
  - subquery alias resolution

## Architectural relation

The intended semantic path is now:

```text
syntax evidence
    ↓
typed syntax relations
    ↓
candidate relations
    ├── requirements
    ├── exclusions
    └── dependencies
    ↓
requirement solver / constraint propagation
    ↓
semantic candidate
    ↓
rewrite / lowering
```

This is deliberately different from replacing `if` with another boolean helper. The candidate carries semantic identity and its admissibility conditions as first-class data.

## Current boundary

Phase 315 does **not** claim that every remaining `if` in RouteSync has been removed. The large remaining populations are concentrated in `astClassifier.ts` and `queryProducer.ts`, where further guard chains must be converted into requirement-bearing candidates or relational rewrites. Syntax words such as `if`, `for`, `while`, and `switch` that occur as PHP AST vocabulary are not themselves imperative control flow and must remain representable as source evidence.

## Validation

All Phase 315 touched TypeScript files parse successfully with the TypeScript parser.

A repository-wide `tsc --noEmit -p tsconfig.json` remains blocked by missing ambient type packages in the workspace:

- `TS2688: Cannot find type definition file for 'node'`.
- `TS2688: Cannot find type definition file for 'vitest/globals'`.
