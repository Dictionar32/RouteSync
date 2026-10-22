# Phase 1789 — PHP Source Inventory Interface-First

## Trace finding

The existing PHP name-resolution authority already validates lexical namespace-region identity, region source boundaries, and region ownership for imports and declarations. However, the Laravel controller analyzer only receives a method-body AST. That AST does not provide a source-complete inventory of file-level namespace declarations, namespace-prefix imports, function imports, and named function declarations. Therefore the scanner cannot truthfully create a complete PHP invocation judgment batch yet.

## Changes

- Added a closed `PhpFunctionResolutionSourceInventory` contract with explicit complete and incomplete outcomes.
- Added `PhpNamespaceRegionInventory`, binding each lexical region to its namespace-prefix imports, function imports, declarations, and completeness witness.
- Added `PHP_FUNCTION_RESOLUTION_SOURCE_INVENTORY_CONTRACT`, requiring source-file and region-boundary binding, per-region ownership, distinct import categories, preserved aliases, and forbidding method-body-only evidence from certifying whole-file completeness.
- Expanded the typed PHP invocation pending blockers to identify the missing whole-file namespace-region inventory and per-region import evidence.
- Changed `createControllerDataflowAnalyzer` to receive `PhpFunctionInvocationSemanticIntegrationState` as an explicit upstream contract. The scanner no longer chooses the pending fallback itself; the composition root supplies the current explicit pending state until the source inventory is implemented.
- Kept the existing integrated response and its `phpFunctionInvocations` slot. No parallel response layer was introduced.

## Semantic reference

PHP imports are compile-time scoped and can alias namespace names and functions; they are distinct import forms. Namespace regions may be multiple within a file. The inventory contract therefore binds imports to lexical regions instead of treating a file path as the only scope identity. TypeScript's discriminated-union model supports explicit complete/incomplete inventory outcomes.

## Audit and limitations

Run `node scripts/audits/audit-phase1789-php-source-inventory-interface-first.cjs` for the static interface/wiring audit.

This phase does **not** claim end-to-end PHP invocation integration. The pending state remains honest because the current scanner AST does not yet collect the required file-level evidence. The next phase should extend source-level declaration parsing and feed region inventories into `PhpFunctionNameResolutionInput`, then derive and close the actual invocation batch before replacing the pending state. Full build/typecheck was not run in this environment.
