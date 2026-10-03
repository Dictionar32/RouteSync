# Phase 604 — Route Semantic Flow Structural Witness

## Objective

Move the scanner route descriptor from class/constructor authority to an immutable structural semantic witness and a frozen relation-oriented creation catalog.

## Model

```text
route source evidence
  -> identity/binding/capability/provenance sub-contracts
  -> structural route semantic witness
  -> relation projections / rewrites
```

`RouteSemanticFlowFactory` is now a value catalog. It is not a class and does not instantiate route descriptors with `new`.

`RouteSemanticFlowFields` is now a structural type plus a relation projection function. `routeMutations.ts` receives a creation relation rather than a constructor type.

`InvalidationResolver` identifies the witness structurally rather than with `instanceof`.

## Unused-file hygiene

The production tree was checked for zero-byte TypeScript files and archive/backup/temp naming residues. No unused zero-byte production file was found, so no active file was emptied speculatively.

## Validation

The changed frontier files transpile with TypeScript with zero diagnostics.

Repository-wide TypeScript checking remains environment-limited by missing `node` and `vitest/globals` type definitions; this phase does not treat those external environment failures as source errors.
