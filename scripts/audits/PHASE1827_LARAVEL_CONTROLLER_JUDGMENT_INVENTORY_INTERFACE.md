# Phase 1827 — Laravel Controller Invocation Judgment Inventory Interface

## Scope

This phase strengthens the upstream interface contract only. It does not migrate production wiring and does not delete or extend the legacy `ControllerScanner` implementation.

## Trace finding

Phase 1826 made the scanner input a plain `readonly LaravelControllerInvocationSemanticJudgmentInterface[]`. That type carries already-formed judgments, but it does not express that the collection is complete, source-project-bound, unique, or in one-to-one correspondence with all discovered controller files. An empty array could be confused with a complete empty source set, and missing, duplicate, or out-of-inventory judgments were not represented by the input contract.

## Interface changes

Added `laravelControllerInvocationSemanticJudgmentInventoryInterface.ts` with:

- `LaravelControllerSourceInventoryInterface`, whose completeness witness makes a complete empty controller-source inventory explicit.
- `LaravelControllerInvocationSemanticJudgmentInventoryInput`, carrying the source inventory and judgments to be closed.
- `LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface`, declaring the authority-owned `close` operation.
- A closed result ADT: `validated` carries a completeness witness; `rejected` carries a non-empty typed rejection ledger for duplicate sources, missing judgments, duplicate judgments, or judgments outside the source inventory.
- `LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT`, declaring total correspondence and preservation of integrated response variants.

`LaravelControllerScanInput` now accepts only the `validated` inventory variant, not a bare judgment array. Its source project is owned by that inventory instead of being duplicated as a separate scan-input property. The scanner contract and scan judgment move to version 6; the semantic boundary contract moves to version 42.

## Ownership rule

The inventory authority owns completeness, uniqueness, and total source-to-judgment correspondence. The controller scanner must not fill gaps, pair by array index, repair duplicates, or reinterpret integrated responses. The judgment remains the canonical owner of `sourceFile` and its exact integrated response.

## Production trace

`packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` still calls `ControllerScanner.scanCanonicalBundle()`. Route and resource consumers still use the legacy controller index. These are intentionally reported as pending; this phase is interface-first and does not claim production migration.

## Verification

Run:

```sh
node scripts/audits/audit-phase1827-laravel-controller-judgment-inventory-interface.cjs
node scripts/audits/audit-phase1826-laravel-controller-judgment-input-interface.cjs
node scripts/audits/audit-phase1825-laravel-controller-production-boundary-interface.cjs
```

Static audits only. Build, typecheck, and E2E are not run.
