# Phase 1475 — Property Type Partition Contract

## Scope

Move delimiter-aware union/intersection partitioning out of `propertyProducer.ts`'s local recursive `splitTopLevel()` implementation and onto the existing upstream `ScannerTokenStructureInterface.partitionTopLevel()` contract.

## Contract path

Source type text → character evidence → `partitionTopLevel` → `partitioned(parts)` or `malformed(location, expected, actual)` → TypeExpression projection.

The producer no longer owns delimiter-depth tracking. Malformed delimiter evidence maps to the closed `TypeExpression` error variant rather than being silently treated as a normal type name.

## Verification

The audit checks that the local splitter is gone, both union and intersection paths delegate to the upstream interface, malformed evidence is preserved as an error, and tests cover nested separators and unbalanced delimiters.

## Boundary

This phase migrates partition authority only. It does not claim full PHP type grammar support or implement DNF parenthesis normalization. Those require a dedicated type-expression grammar judgment and AST projection contract.
