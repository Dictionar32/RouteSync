# Phase 1420 — Scanner Boundary and Assignment Contract Closure

## Source trace

The scanner runtime previously reduced top-level token searches to a numeric index, making `not_found` and malformed token structure indistinguishable to callers. Statement-boundary scanning tracked delimiter counts independently, which could miss mismatched nesting such as `([)]`. Assignment decomposition returned `RelationOption`, so malformed input and ordinary unresolved assignments were collapsed into the same absence value.

## Changes

- `scannerStatementBoundaryAlgebra.ts` now tracks delimiter kinds with a typed stack and returns `malformed` for invalid starts, unexpected/mismatched closers, and unclosed delimiters.
- `scannerStatementSequenceAlgebra.ts` rejects malformed boundaries and validates the relationship between boundary kind and index before invoking simple/structured resolvers.
- `scannerAssignmentPartsAlgebra.ts` now returns a closed resolution ADT: `resolved`, `unresolved`, `malformed`, or `contract_violation`. The unresolved variant preserves a reason. Token-structure malformed results are no longer flattened to a numeric `-1` inside assignment resolution.
- `astClassifierRuntime.ts` supplies PHP operator vocabulary and PHP-specific target/value resolvers, and explicitly adapts every assignment outcome. Its top-level operator adapter no longer collapses malformed structure into `-1`; malformed input surfaces as an error. Binary operator selection also reuses the observed index rather than scanning the chosen operator a second time.
- Focused tests cover delimiter nesting, malformed boundaries, sequence rejection, assignment resolution and explicit malformed results.

## Ownership boundary

Generic delimiter traversal, boundary validation, sequence progress, assignment candidate control and result closure belong to upstream algebra. PHP operator spellings, PHP target grammar, AST node construction and expression construction remain language-specific capabilities supplied by runtime.

## Verification

- Focused emitted-JavaScript assertions: 10/10 passed.
- Strict TypeScript check for the four algebra modules: passed.
- Full runtime typecheck remains blocked by pre-existing errors in unrelated query/dataflow/upstream modules. Full build remains pending because `tsdown` is not installed in this workspace.
- `npm run build` remains unchanged as `tsdown`.
