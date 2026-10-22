# RouteSync Phase 1837 — Required Controller Inventory Receipt

## Scope

This phase tightens the interface boundary before attempting route/resource production migration. The source AST pipeline, scanner facade, and manifest builder no longer accept an independently supplied `SourceProjectIdentity` or an optional inventory receipt. Their only ingress is the authority-produced `LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt`; the project identity is derived from `receipt.sourceInventory.sourceProject`.

## Changed boundaries

- `LaravelSourceAstPipelineInterface.execute(receipt)` is required and versioned.
- `LaravelSourceAstScannerInterface.scan(receipt)` is required and versioned.
- `ManifestBuilderInterface.build(receipt)` is required and versioned.
- `laravelSourceAstPipeline` derives the source project from the receipt.
- `laravelSourceAstScanner` forwards only the receipt.
- `constructRouteSyncManifest` derives manifest source identity from the receipt.
- `ControllerScanner` no longer has a no-receipt path that discovers controller files and synthesizes `not_connected` evidence locally. Its entrypoints require the receipt.
- CLI manifest composition passes the authority-validated receipt directly.
- Tests that intentionally skip invocation integration now explicitly construct a test-only receipt whose per-source outcome is `not_connected`, then close that inventory through the authorities.

## Audit

`audit:phase1837-required-controller-inventory-receipt` — 14/14 static checks passed.

The Phase 1836 downstream-interface audit also passed 17/17. `package.json` JSON parsing passed.

Build, typecheck, and E2E were not run.

## Known remaining migration gap

The core pipeline still calls `ControllerScanner.scanCanonicalBundle`, `ResourceScanner.scanCanonicalBundle`, and `RouteScanner.scanCanonicalBundle`. Therefore this phase does **not** claim that the new `LaravelControllerScannerInterface`, `LaravelResourceScannerInterface`, and `LaravelRouteScannerInterface` are the concrete production implementations yet, and it does not retire the legacy subscanner directory.

The next phase should implement the existing scanner interfaces against the correlated controller scan judgment and its upstream semantic products, then migrate route/resource consumers away from `ControllerActionInfo` and legacy controller indexes. Only after production references are gone should the corresponding legacy subscanners be removed.
