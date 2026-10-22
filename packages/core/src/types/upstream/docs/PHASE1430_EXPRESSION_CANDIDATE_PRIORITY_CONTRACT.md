# Phase 1430 — Expression Candidate Priority Contract

## Boundary decision

`ScannerExpressionCandidateAlgebra` owns candidate arbitration. Candidate order is contract data (`priority`), not an accidental property of array layout. The algebra validates identity, priority validity, and priority uniqueness before evaluating any candidate, then evaluates candidates lazily in ascending priority and stops at the first resolved judgment.

## Ownership

- Scanner runtime supplies token-derived evidence and explicit candidate declarations.
- Upstream algebra validates the decision contract and selects the winning candidate.
- The PHP expression projector constructs the language AST from the selected structure.
- Downstream consumers must use the selected structure/judgment and must not repeat candidate arbitration.

## Remaining migration frontier

The scanner still owns token evidence collection, PHP operator vocabulary, and the explicit priority values. Those are the next interface-evolution targets: move priority policy into a named language-level expression policy contract, leaving the scanner adapter to report evidence only. Do not create a second expression ADT; evolve `scannerExpressionCandidateAlgebra` and `scannerExpressionStructure` in place.

## Invariants

1. Duplicate candidate IDs fail before any resolver executes.
2. Missing, negative, non-integer, or duplicate priorities fail before any resolver executes.
3. Candidate execution is lazy and deterministic by priority.
4. AST construction remains downstream of structural judgment.
5. No `any` is introduced.
