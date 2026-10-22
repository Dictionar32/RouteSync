# Phase 1810 — PHP AST Inventory Completeness, Interface First

## Trace finding

The Phase 1809 adapter reused one `inventoryMappingComplete` state for two independent evidence domains: namespace/import/declaration inventory and invocation/callee/argument inventory. It also mutated that state while processing namespace declarations before its `let` declaration, which could trigger a temporal-dead-zone `ReferenceError` for namespaced PHP source.

## Changes

- Split the state into `sourceInventoryMappingComplete` and `invocationMappingComplete`.
- Initialize both before any AST traversal branch can mutate them.
- Treat namespace AST nodes without valid source spans as incomplete source inventory instead of silently dropping them.
- Source inventory coverage now depends only on namespace/import/declaration mapping.
- Invocation inventory coverage now depends only on invocation/callee/argument mapping.
- Aggregate frontend coverage is complete only when both inventories are complete.
- Incomplete aggregate coverage reports missing obligations from the corresponding evidence domain.
- No new parser dependency, `semantic/foundation` dependency, or `semantic/relations` dependency was introduced.

## Validation

Run `node scripts/audits/audit-phase1810-php-ast-inventory-completeness-interface-first.cjs` and the Phase 1809 regression audit. These are static source audits only. No build, typecheck, parser runtime test, or end-to-end scanner execution was performed.

## Remaining work

The CLI whole-file pipeline entry exists but is not yet called by the active controller scan path. A runtime test with the installed `php-parser` dependency and the actual CLI-to-scanner integration are still required before claiming end-to-end invocation judgment coverage.
