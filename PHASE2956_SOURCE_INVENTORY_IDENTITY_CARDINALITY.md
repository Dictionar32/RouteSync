# Phase2956 — Source Inventory Identity Cardinality ADT

## Objective

Remove the remaining numeric identity-count reasoning from the upstream source inventory used by CLI manifest construction. Preserve the canonical identity authority and give the result explicit domain continuations.

## Runtime trace

```text
controllerInvocationManifestBuilder.build(input)
  -> controller invocation manifest composition
  -> source inventory + invocation judgments
  -> LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close(input)
  -> source inventory identity cardinality / duplicate projection
  -> correspondence and orphan judgment rejections
  -> manifest terminal judgment
```

## Contract change

`packages/core/src/types/upstream/names.ts` now defines `SourceFileIdentityInventoryCardinality` with three closed outcomes:

- `source_file_identity_inventory_no_match`
- `source_file_identity_inventory_one_match`
- `source_file_identity_inventory_multiple_matches`

Each outcome carries `includeRelation(...)` and `continueWith(...)`. Accumulation delegates each comparison to the existing `laravelSourceIdentitySemantics.relateSourceFiles(...)` judgment. No new identity comparison rule is introduced.

`SourceFileInventoryOperations` now exposes:

- `identityCardinalityAs(sourceFile)` — returns the explicit cardinality ADT rather than a raw number.
- `duplicateIdentities()` — projects repeated source-file identities as a domain inventory.

The old `countSameIdentityAs(...)` operation was removed. Inventory uniqueness consumes `duplicateIdentities()`. Orphan judgment detection consumes `identityCardinalityAs(...).continueWith(...)` and handles the no-match outcome directly, rather than comparing a numeric count against a minimum.

The public cardinality factory and contracts are exported through `packages/core/src/index.ts`. `packages/core/src/types/upstream/collections.ts` remains empty.

## Audit results

- Phase2956 structural audit: 13/13 passed.
- Phase2955 cardinality audit: 10/10 passed.
- Phase2954 invocation judgment audit: 9/9 passed.
- Phase2953 inventory identity audit, updated to the new domain contract: 11/11 passed.
- Phase2952 identity continuation audit, updated to the new domain contract: 11/11 passed.
- TypeScript syntax transpilation: 4 changed TypeScript files, zero syntax diagnostics.
- `package.json` parsing: passed.
- `collections.ts`: 0 bytes.
- ZIP integrity: verified after packaging.

These are structural and syntax checks, not a full project typecheck. Vitest, full typecheck, full build, and CLI end-to-end were not run. The environment previously lacked local Vitest and required project type definitions; no runtime/test pass is claimed.

## Official reference

The TypeScript Handbook describes interfaces as named contracts for object shapes and operations, and discriminated unions as explicit alternatives: [Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces) and [Narrowing / Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing).
