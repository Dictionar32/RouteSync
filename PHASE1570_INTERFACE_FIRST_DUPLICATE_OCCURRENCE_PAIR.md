# Phase 1570 — Interface-First Duplicate Occurrence Pair

## Semantic gap

A tuple `readonly [T, T, ...T[]]` proves cardinality at the type level, but its positions are unnamed. It does not communicate which two occurrences form the primary collision pair, nor does it make the authority's distinct-location obligation obvious at the data-model boundary.

## Interface change

`RequestTypeDuplicateOccurrencePair<T>` is now a named record with:

- `first`: first colliding source occurrence;
- `second`: second colliding source occurrence;
- `additional`: further occurrences sharing the semantic identity.

`T` is constrained to source evidence carrying a domain-tagged `occurrenceKey`. The existing law `duplicate_occurrences_are_distinct_source_locations` remains authoritative: the type shape cannot prove that two runtime key values differ. The semantic authority must compare them and return `duplicate_occurrence_location_reused` with the repeated key when they do not.

## Scope

Only the upstream request-type interface, its static audit, and this phase note changed. Scanner aggregation, `RequestTypeDeriver`, and runtime executor are intentionally untouched. This is not an authority implementation or a full build claim.

## Architecture references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic compiler analyses should depend on semantic interfaces rather than concrete implementation details.
- TypeScript narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing — discriminated/structured types make semantic variants explicit, while value-level invariants still require runtime verification.
