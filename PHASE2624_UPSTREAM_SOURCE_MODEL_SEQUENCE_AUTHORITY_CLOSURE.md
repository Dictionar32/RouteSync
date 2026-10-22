# Phase 2624 — Upstream Source Model Sequence Authority Closure

## Root cause

`core/src/types/upstream/highLevelSourceModel.ts` used to import generic sequence traversal and ADT-folding helpers from `core/src/semantic/relations/relationalSequence.ts`. The upstream `Sequence<T>` ADT is owned by `core/src/types/upstream/collections.ts`, so source-model construction had a downward dependency on the semantic-relations implementation for ordinary collection traversal. It also duplicated local `sequenceToArray`, `sequenceProject`, `sequenceExpand`, and `sequenceFromArray` implementations.

## Changes

- Added `SequenceAlgebraInterface` to the existing upstream owner `collections.ts`.
- Added the canonical `export const sequenceAlgebra: SequenceAlgebraInterface` operation value.
- Routed source-model sequence traversal and construction through that canonical algebra.
- Replaced array projection/expansion uses of relation helpers with native array transformations.
- Replaced the relation-library policy option/fold chain with the existing upstream `Lookup` ADT and `matchLookup` eliminator.
- Replaced relation equality for policy identity matching with direct equality of the already-extracted canonical identity values.
- Registered `audit:phase2624-upstream-source-model-sequence-authority` in `packages/cli/package.json`.

## Architecture impact

The `Sequence` data shape, its operations, and their public barrel now share the same upstream owner. The source-model builder no longer imports `semantic/relations` directly for sequence operations or policy lookup. This is a root ownership/wiring correction, not a file move or suppression of an audit finding.

## Verification

The Phase 2624 structural audit checks the ownership boundary, canonical `export const name: Interface` operation, use of the existing `Lookup` ADT, and CLI audit registration. Full TypeScript typecheck, package build, Vitest, and end-to-end CLI execution were not run in this workspace; those remain required before declaring runtime closure.
