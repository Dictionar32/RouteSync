# Phase 2724 — Semantic Resource Matcher Ownership

## Applied source changes

Moved `structuralFieldMatcher.ts` from `packages/core/src/compiler/scanner/resolvers/resource/` to `packages/core/src/compiler/semantic/resource-model/`. The structural candidate scoring algorithm is semantic decision logic, so it no longer lives under scanner resolver wiring.

The matcher now depends on a narrow `StructuralModelSymbolCollectionInterface` (`all(): readonly OriginModelSymbol[]`) rather than importing the scanner-owned `ModelSymbolTable` type. The existing runtime operation remains interface-first:

```ts
export interface StructuralFieldMatcherInterface {
  readonly match: (
    fieldNames: readonly PropertyName[],
    modelSymbolTable: StructuralModelSymbolCollectionInterface,
  ) => Presence<OriginModelSymbol>;
}

export const structuralFieldMatcher: StructuralFieldMatcherInterface = Object.freeze({
  match: matchStructuralFieldsImplementation,
});
```

`ResourceModelResolver.ts` now imports this operation from the semantic owner and calls `structuralFieldMatcher.match(...)`. No example-only implementation was added. The old scanner implementation file was removed. Existing historical inventory artifacts were not rewritten as if they were current source; the live audit scripts that reference this path were updated.

## CLI-to-manifest trace

```text
CLI scan / sync
  -> manifestScanOperation.scan(input)
  -> CLI upstream composition
  -> controller-invocation manifest composition authority
  -> source identity / discovery / document binding
  -> invocation semantic judgments
  -> inventory authority
  -> manifestBuilderOperationPreparation.prepare(input).build()
  -> Laravel source AST pipeline
  -> complete source model builder
  -> semantic dataflow + resource-group capability composition
  -> manifest_builder_complete | manifest_builder_blocked
```

The matcher move does not alter upstream manifest sequencing or merge `blocked` and `complete` into a boolean.

## Verification

- `npm run audit:phase2724-semantic-resource-matcher-ownership`: **16/16 static checks passed**.
- Phase 2722 audit rerun: **16/16 passed**; it honestly reports 28 files still importing the removed `relationFoundation`.
- Phase 2723 audit rerun: **14/14 passed**.
- Relative imports in the two live matcher/resolver files resolve.
- Full TypeScript typecheck, unit tests, build, and CLI end-to-end remain unverified. Static audits are not a substitute for them.

## Remaining source problems

- No `relationFoundation` replacement was created. Its legacy imports remain and need migration to actual semantic owners; this phase does not claim they are fixed.
- Scanner is not yet fully wiring-only. This phase moved one semantic scoring implementation and reduced its dependency on scanner-owned types; other scanner implementation directories remain.
