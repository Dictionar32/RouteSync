# Phase 3121 — Inventory-Owned Manifest Build Operation Migration

## Runtime slice changed

`LaravelControllerInvocationSemanticJudgmentInventoryResult` was carrying a generic `continueWith<Result>(handlers)` visitor. The CLI had to supply `onValidated` and `onRejected` handlers, and the validated handler reconstructed the manifest-builder input outside the upstream inventory result.

The validated inventory now owns `buildManifest(input)`, with a domain-specific input containing the route-selection intent and the manifest-builder preparation interface. The operation passes the exact authority-produced `receipt` into `ManifestBuilderInput` and returns the original typed `ManifestBuilderJudgment`. The rejected inventory now owns `preserveRejectedInventory()`, preserving its source inventory and full rejection ledger.

The CLI composition now invokes these named operations and retains its existing terminal projection boundary. No CLI manifest type was imported into core. The deleted generic relation foundation modules were not restored or re-exported.

## Runtime trace

`PHP source discovery -> source-document reading -> semantic judgment production -> inventory authority close(...) -> validated inventory.buildManifest(...) -> ManifestBuilderOperationPreparationInterface.prepare(...) -> ManifestBuilderInterface.build() -> CLI terminal projection -> manifest output`

Rejected inventory follows `inventoryResult.preserveRejectedInventory()` into the existing CLI inventory-rejected terminal. Its rejection ledger and source inventory remain attached.

## Static verification boundary

Run `node scripts/audits/test-phase3121-inventory-owned-manifest-build.cjs`. This is a CJS structural/TypeScript-AST gate, not a full typecheck or an end-to-end runtime test. Full typecheck and E2E remain unverified in this extracted workspace because project dependencies are not installed.
