# Phase 3084 — Fully Explicit Typed Runtime Scanner Operations

## Change

The identity-binding batch no longer stores both `bindings` and a second `readResults` array. `bindings` is the authoritative evidence collection. `readResults()` is an explicit domain projection that derives an immutable, ordered read-result sequence from those bindings without `map`.

Runtime consumer update:

```ts
onBound: boundBatch =>
  phpSourceDocumentReadBatchFactory.fromResults(boundBatch.readResults()).continueWith({
    onBlocked: blockedBatch => /* existing CLI terminal operation */,
    onComplete: completeBatch => /* existing semantic continuation */,
  })
```

The actual CLI implementation keeps its existing terminal outcomes and is updated to call `readResults()`.

## Runtime trace

`CLI scan/sync → manifest scan operation → Laravel controller source discovery → ordered read settlements → identity-binding ADT → immutable readResults() projection → document-read batch → semantic invocation → manifest composition/projection → manifest contract validation → canonical manifest JSON persistence`.

The identity-binding ADT retains successful bindings and all identity rejections in a rejected outcome. Rejection remains monotonic. The core remains independent of CLI manifest terminal types. Deleted relation-foundation modules are not restored.

## Verification boundary

Run `npm run audit:phase3084-derived-read-result-projection`. The audit executes runtime scenarios for order preservation, evidence retention, immutable projection and the empty batch, then checks TypeScript syntax and repository invariants. Syntax transpilation is not a substitute for strict TypeScript checking, the full test suite, or a PHP → CLI → manifest → generator end-to-end run; those remain unverified in this workspace.

## Domain-modeling reference

PHP interfaces describe operation contracts and type declarations constrain values at boundaries. Laravel controller actions similarly define named operations that route requests to. RouteSync applies the analogous principle by letting upstream domain evidence own its next operation rather than making CLI consumers reconstruct projections.
