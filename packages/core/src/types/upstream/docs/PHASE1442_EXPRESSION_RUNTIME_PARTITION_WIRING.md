# Phase 1442 — Expression Runtime Partition Wiring

## Required flow

`Source evidence → Semantic reasoning algebra → Closed judgment/contract → Interface → Wiring → Runtime executor → Downstream projection`

## Scope completed

The four remaining `findTopLevelOperator` consumers in `astClassifierRuntime.ts` now consume token occurrence evidence rather than a numeric offset:

- Inline array keyed entries use `before` as the key and `after` as the value.
- Match arms use `before` as conditions/default marker and `after` as the arm value.
- `instanceof` uses the occurrence partitions to derive the expression and class token.
- Collection iteration uses the `as` occurrence to separate iterable and binding target.

The runtime compatibility helper returning `number` and its unused cursor parameters have been removed. `findTopLevelOperatorEvidence` returns a typed occurrence evidence object (or `undefined` for not-found) and delegates malformed delimiter detection to `scannerTokenStructureInterface`.

## Authority boundary

- The source adapter supplies `TokenDescriptor` observations and `token.value` vocabulary.
- `scannerTokenStructureInterface` owns top-level occurrence judgment and delimiter balance.
- Expression/operator algebra owns structural arbitration and operator semantics.
- Runtime constructs AST nodes from the partitions; it no longer derives an operator offset and slices again.
- AST remains the downstream projection; AST shape regression tests were added for array entries, match arms, `instanceof`, and `foreach` bindings.

## Remaining migration frontier

This phase removes the four runtime offset consumers listed above. It does not claim that all scanner cursor arithmetic has disappeared: statement traversal, delimiter internals, assignment algebra compatibility callbacks, and other parser paths still use offsets. Those must be migrated at their own contract boundaries and verified with AST equivalence before removing internal cursor machinery.

## Validation

The Phase 1442 static audit checks the no-offset runtime contract and four consumer migrations. The added Vitest regression suite is source-level coverage; it must be executed in a workspace with the repository's installed toolchain. A successful static audit is not a substitute for runtime tests or a complete TypeScript build.
