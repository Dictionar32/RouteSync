# Phase 372 — Relational Semantic Reservoir Migration

This phase continues the semantic authority cutover beyond the canonical gate.

## Migrated boundaries

- `semantic/SymbolTable.ts`: lookup and collection classification now use relation selection/projection/fold/refinement; no host `if/for/map/filter/reduce/flatMap/undefined/??/===/!==/as/unknown`.
- `semantic/CycleDetector.ts`: entry decision is a relation gate rather than host `if`.
- `types/upstream/collections.ts`: Lookup/Discovery/Discovered dispatch is expressed through relation refinement and option folding rather than `switch` or assertions.

## Authority model

The semantic path is:

source evidence → typed relation facts → constraints → relation refinement → rewrite/solver → fixed point → semantic result

Source-language constructs such as PHP `null`, `if`, `for`, `while`, and `switch` remain *data-level syntax evidence*. They are not allowed to become TypeScript semantic control-flow authority.

## Verification

Canonical Phase 370 authority audit remains the hard zero-violation gate.

The repository-wide reservoir audit remains non-zero by design at this checkpoint; it is the migration frontier and must be reduced phase by phase rather than hidden by lexical substitutions.
