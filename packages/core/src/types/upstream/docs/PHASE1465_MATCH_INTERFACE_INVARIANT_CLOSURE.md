# Phase 1465 — Match Interface Invariant Closure

## Scope

Interface-only phase. No match algebra, runtime wiring, runtime helper, or AST projection is changed.

## New source-malformedness judgments

- `SCANNER_MATCH_EMPTY_BODY`: a syntactically recognized match body contains no arm.
- `SCANNER_MATCH_EMPTY_CONDITION`: a conditional arm has an empty condition partition, including an empty partition created by adjacent top-level commas.
- `SCANNER_MATCH_MULTIPLE_FAT_ARROWS`: an arm contains more than one top-level `=>` candidate.

These are `unique symbol` identities. The literal spelling `=>` remains lexical evidence, not a semantic identity.

## Resolved evidence invariants

A resolved judgment is valid only when:

1. The body contains at least one arm.
2. Every conditional arm has one or more non-empty conditions.
3. The number of condition separators is exactly one less than the number of conditions.
4. Every arm has exactly one top-level fat-arrow token and a non-empty value.
5. A default arm contains no conditions, and at most one default arm occurs.
6. Each arm's source reconstructs from its grammar partitions by token identity.
7. Concatenating each arm source with its optional following comma reconstructs the original body exactly.
8. Reassembling keyword, subject partitions, interstitial tokens, body partitions, delimiters, and suffix reconstructs the query token sequence exactly.

Source malformedness remains distinct from a contract violation. A malformed source is an input-level judgment; a contract violation means an implementation returned evidence that breaks one of the invariants above.

## Dependency boundary

`ScannerTokenStructureInterface` remains the structural authority. The match interface declares the required dependency; this phase does not implement the authority or the match resolver.

## Deferred work

The next phase may implement the algebra and tests against these invariants. Runtime wiring remains blocked until exact partition reconstruction, nested separators, default-arm constraints, malformed delimiters, and contract-violation paths are covered.
