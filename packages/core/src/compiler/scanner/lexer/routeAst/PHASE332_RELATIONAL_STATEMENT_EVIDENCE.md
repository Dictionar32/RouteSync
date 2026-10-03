# Phase 332 — Relational Statement Evidence Boundary

## Goal

Continue replacing parser/adapter semantic branching with declarative relation selection and witness refinement.

## Changes

- `phpAstStatementSyntaxEvidenceRegistry.ts`
  - removed `??` from the statement relation dispatcher;
  - routed statement evidence equality through `relationEqual` / `relationNotEqual`;
  - migrated counted-recurrence clause absence from JavaScript `undefined` to `RelationOption` (`relationNone`, `relationSome`, `relationOptionFold`);
  - migrated assignment-target and switch/finally discriminants through relation refinement;
  - removed `as any` / `as` assertions from this file;
  - removed `if`-style absence tests from the migrated recurrence boundary;
  - source-language control forms remain syntax evidence only; semantic control remains region/dependency relations.

## Architectural rule

Absence is a relation witness. Concrete syntax kinds are candidates. Semantic facts are produced only after refinement. Recurrence is represented by bidirectional dependencies and solved by closure rather than a semantic loop node.

## External design anchors

- Soufflé: typed relations and Horn-style rules.
- MLIR PDL/PDLL: declarative matching separated from rewrite.
- JastAdd: circular attributes over finite-height lattices with monotonic equations.
- Statix/Spoofax: constraints over scope graphs.
- Maude: rewriting logic as an executable semantic framework.

## Verification

- `packages/core/src`: 1369 TypeScript files parsed successfully with TypeScript parser diagnostics = 0.
- This phase does **not** claim repository-wide elimination of every banned token. The remaining frontier is concentrated in cursor/syntax-value compatibility boundaries and legacy parser representations.
