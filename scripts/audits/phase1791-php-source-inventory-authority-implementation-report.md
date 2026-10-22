# Phase 1791 — PHP Source Inventory Authority Implementation

## Trace

The upstream interface introduced in Phase 1790 described a complete/incomplete source inventory but had no implementation of `PhpFunctionResolutionSourceInventoryAuthorityInterface`. Therefore, its contract was declarative only and could not validate source-file identity, whole-file coverage identity, region ownership, region boundaries, or overlap before publishing a complete inventory.

The Laravel controller scanner still receives `PhpFunctionInvocationSemanticIntegrationState` through the existing composition root. The integrated response already has `phpFunctionInvocations`; the actual whole-file PHP inventory is not yet produced by the scanner. This phase intentionally does not fabricate a complete batch or remove the pending state.

## Changes

- Added `phpFunctionResolutionSourceInventoryAuthority.ts` as the implementation of the existing upstream authority interface.
- The authority verifies source-file and whole-file-span binding, complete coverage obligations, region boundary validity, region completeness witness identity, and every namespace import/function import/declaration's region and source-span ownership.
- Duplicate region identities and overlapping region spans are rejected.
- Empty region collections cannot be certified as complete; implicit global scope must be represented as an explicit region by the source frontend.
- Incomplete evidence produces the existing closed `php_function_resolution_source_inventory_incomplete` result with typed missing obligations.
- Exported the authority through the upstream index. No parallel response model was added and no dependency on `semantic/foundation` or `semantic/relations` was introduced.

## Remaining blockers

- Parser/frontend must produce source-wide namespace region, import, declaration, and boundary evidence.
- The inventory authority result must be converted into region-specific `PhpFunctionNameResolutionInput` environments.
- Real source invocation evidence must be resolved and converted to invocation judgments, then closed by the existing batch closure authority.
- Only a validated batch should replace the pending integration state in the existing composition root and flow into the existing integrated response.
- Subscanner removal remains deferred until consumers are migrated and reference-audited.

## Verification

Static audits: Phase 1791 (20), Phase 1790 (11), Phase 1789 (13), and Phase 1788 (13). These audits verify source-level contract boundaries; they are not TypeScript compilation or end-to-end integration tests. Build/typecheck was not run.

## External references

- PHP `token_get_all()` documents that PHP's Zend lexical scanner tokenizes source and returns token identifiers: https://www.php.net/manual/en/function.token-get-all.php
- PHP parser tokens identify namespace declarations and qualified/fully qualified/relative names: https://www.php.net/tokens.php
- TypeScript discriminated unions support explicit tagged alternatives and exhaustive handling: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
