# Phase 402 — Scanner Control Evidence Boundary

## Goal

Raise the remaining scanner/lexer control dispatch above source-language branching without pretending that source spellings can disappear from the lexer itself.

The architecture is now:

`raw PHP token -> control evidence relation -> abstract control candidate -> requirement solver -> lazy AST rewrite`

Raw PHP control spellings are confined to `phpControlEvidence.ts`. The parser dispatch no longer compares source spellings directly and no longer names solver candidates after source constructs.

## Changes

- Added `packages/core/src/compiler/scanner/lexer/phpControlEvidence.ts`.
- Introduced the abstract control relation vocabulary:
  - `conditional`
  - `collection_iteration`
  - `counted_iteration`
  - `pretest_iteration`
  - `selection_dispatch`
  - `exception_guard`
  - `exception_raise`
- Renamed parser dispatch routines to semantic roles rather than source-control names.
- `parseStructuredStatement` now derives a `RelationOption<PhpControlEvidence>` and feeds only the abstract relation into `solveCandidate`.
- Solver candidates carry lazy parser rewrites (`() => AST`) so non-selected branches are not evaluated before the rule is admitted.
- Equality for control-role matching uses canonical `relationEqual` from `semanticRelations`.

## Why this is the higher-level model

The source spelling is lexer evidence, not semantic authority. This follows the same separation visible in declarative rewrite systems: pattern/evidence is matched first, constraints select an admissible rule, and only the selected rewrite is applied. MLIR PDLL explicitly separates matching/constraints from rewriting; egglog likewise distinguishes defining rules from running them and supports saturation. citeturn0search0turn1search3

Souffle and Z3's fixed-point engines further support the architectural direction of treating control/dataflow facts as relations and Horn-style constraints rather than imperative dispatch. citeturn1search0turn1search2

## Audit

`astClassifierEvidence.ts` dropped from 324 to 312 forbidden-pattern matches in the local scanner audit.

The new evidence catalog intentionally contains the four raw PHP control spellings needed to recognize source syntax. Those spellings are now isolated to the lexer-evidence boundary rather than distributed through parser dispatch.

The scanner remains under migration. The largest remaining authority leak is `queryEvidenceProducer.ts`, followed by `astClassifierEvidence.ts` and the controller/provider/migration canonicalizers.

## Validation

- TypeScript syntax parsing of both modified files: passed.
- Full project typecheck remains environment-blocked by missing `node` and `vitest/globals` definitions; a broader check also encounters pre-existing dependency/type errors outside this phase.
- No claim of repository-wide type cleanliness is made.
