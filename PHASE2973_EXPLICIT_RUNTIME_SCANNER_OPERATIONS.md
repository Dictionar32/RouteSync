# Phase2973 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Implemented

The source-observation ready judgment previously had two near-identical implementations: default route selection and explicitly selected route files each rebuilt the same ready ADT, read operation, and `PhpSourceDocumentReadBatchJudgment`. This duplicated domain operation wiring and risked the variants drifting apart.

The implementation now exposes one interface-typed runtime factory:

```ts
export const laravelRouteSourceObservationReadyFactory: LaravelRouteSourceObservationReadyFactoryInterface = Object.freeze({
  create: ({ sourceFiles, scannableSources }) => { /* canonical ready ADT and domain continuation */ },
});
```

Both default and explicit source-selection intents delegate ready construction to this factory. The ready ADT still owns the legal next domain action: read only its scannable inventory, fold the read results into the typed read-batch judgment, then hand that judgment to the route-scan continuation. The explicit-missing variant still preserves its exact missing-file evidence and cannot enter the read path.

The factory and its interface are exported from the core public entry. The implementation uses an explicitly typed `export const` object, not an exported function declaration or an inferred exported arrow factory.

## Runtime path trace

Laravel `routes/*.php` selection and source evidence → `LaravelRouteSourceSelectionIntent.observeFiles(...)` → presence judgment ADT → canonical ready factory or explicit-missing blocker → ready judgment's `continueToRouteScan(reader, continuation)` → `PhpSourceDocumentReadBatchJudgment` → `LaravelRouteScannerInterface` → source AST pipeline → manifest-builder judgment → manifest flow projection → typed CLI upstream composition.

The public runtime entrypoints on the traced CLI/core path remain interface-typed object exports. The audit checks the direct trace, public export, ADT operation ownership, duplicated ready wiring, and preservation of the deleted relation-foundation boundary.

## Example usage

```ts
const observation = intent.observeFiles(selectedFiles, sourcePresence);
const outcome = await observation.continueToRouteScan(sourceReader, {
  scanReadyObservation: async (ready, readBatch) => {
    // Route scanner owns interpretation of the read-batch judgment and scan outcome.
    return routeScanContinuation(ready, readBatch);
  },
});
```

The ready judgment, rather than a downstream caller inspecting `kind`, decides which files are eligible to read. Explicitly selected missing files remain blockers; absent conventional/default route files remain optional observations under default selection intent. This follows Laravel's documented routing configuration: default route files are configured through `bootstrap/app.php`, and applications may customize which route files are loaded. See [Laravel Routing](https://laravel.com/framework/docs/routing).

## Verification boundary

Run `npm run audit:phase2973-explicit-runtime-scanner-operations` for the structural audit. Full build/typecheck/CLI end-to-end status is not claimed: the workspace still contains unresolved imports to the intentionally deleted relation-foundation modules. The audit reports their current count separately. No relation foundation was restored, and `packages/core/src/types/upstream/collections.ts` remains empty.
