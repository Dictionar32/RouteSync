# Phase 1810 — PHP AST Inventory Completeness, Interface First

## Decision

Evolve the existing `PhpSourceFrontendContract` rather than introducing a duplicate parser interface. The frontend contract is now v4 and explicitly separates the evidence required to close the namespace/import/declaration inventory from the evidence required to close the invocation/callee/argument inventory. Aggregate complete coverage requires both closed inventories.

The extraction-validation contract is now v6 and names independent inventory closure as a validation rule. Existing validation logic already rejects a complete aggregate claim if either inventory is incomplete.

## Trace finding

Phase 1809's whole-file AST adapter reused one `inventoryMappingComplete` flag for both evidence domains. Namespace processing also attempted to mutate that flag before its `let` declaration, which could trigger a temporal-dead-zone `ReferenceError` for named namespace source. Namespace nodes without source spans were silently filtered, potentially hiding missing source evidence.

## Changes

- Split the adapter state into `sourceInventoryMappingComplete` and `invocationMappingComplete`.
- Initialize both states before namespace processing.
- Mark source inventory incomplete when a namespace AST node has no valid source span.
- Source inventory closure now depends only on namespace/import/declaration mapping.
- Invocation inventory closure now depends only on invocation/callee/argument mapping.
- Aggregate frontend coverage is complete only when both inventories are complete.
- Incomplete aggregate evidence identifies the affected inventory domain.
- Updated Phase 1803–1805 regression audits to track the current contract versions.
- Added `scripts/audits/audit-phase1810-php-ast-inventory-completeness-interface-first.cjs`.

## Audit results

- Phase 1803: 12/12
- Phase 1804: 16/16
- Phase 1805: 16/16
- Phase 1806: 12/12
- Phase 1807: 12/12
- Phase 1808: 14/14
- Phase 1809: 26/26
- Phase 1810: 24/24
- Total: 132/132 static checks passed.

## Limits

No build, typecheck, parser runtime test, or end-to-end CLI/scanner execution was performed. The `phpSourceInvocationSemanticPipeline` entry point exists in CLI but is not yet invoked by the active controller scan path. Phase 1810 therefore fixes the adapter's contract/completeness defect; it does not claim end-to-end Laravel invocation judgment integration is complete.
