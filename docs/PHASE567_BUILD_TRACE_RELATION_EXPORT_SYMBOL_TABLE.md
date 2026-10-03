# Phase 567 — Build Trace Relation Export + SymbolTable Closure

## Trace

The Phase 566 build log moved past the previous `buildIRNode.ts` syntax/narrowing failure. The remaining build blockers are:

1. `relationIsSome` is referenced by four modules but is not imported into the `relationalSequence.ts` export surface.
2. `SymbolTable` treats relational collection wrappers (`ModelColumnFacts` and `Sequence<ModelSemanticProperty>`) as native readonly arrays. This produces DTS failures and collapses `relationOptionFold` inference to `unknown`.

## Repair

- `relationalSequence.ts` now imports `relationIsSome` from the foundational relation module and re-exports it from the canonical sequence surface.
- `SymbolTable.ts` now materializes the canonical `Sequence<T>` representation through `relationSequenceToArray` before array relation operators are applied.
- `ModelColumnFacts.items` is used as the actual semantic sequence payload.
- `ModelSemanticSurface.properties` is converted through the same relation boundary before relation selection.

## Verification

The two modified files pass TypeScript transpilation with zero diagnostics.

A full `npm run build` was not executed in the extracted checkpoint because `node_modules` is absent. The user's Phase 566 build log remains the authoritative full-build trace.
