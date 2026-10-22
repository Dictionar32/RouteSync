# Phase 1763 — Upstream PHP Builtin Semantic Catalog

## Trace finding

`resourceUpstreamExpressionCanonical.ts` owned a 94-entry table that classified PHP function-call names into the canonical `BuiltinFunction` ADT. This was domain semantic knowledge embedded in a scanner subscanner, so the `PhpAstExpressionSemanticAuthorityInterface` boundary from Phase 1762 did not yet make the function-call vocabulary upstream-owned.

## Interface-first correction

- Added `types/upstream/phpBuiltinFunctionSemanticCatalogInterface.ts` with a closed `PhpBuiltinFunctionSemanticName` vocabulary and typed source-name-to-`BuiltinFunction` bindings.
- Added `types/upstream/phpBuiltinFunctionSemanticCatalog.ts` as the canonical upstream catalog.
- Exported the interface and catalog from the upstream barrel.
- Removed the scanner-local `builtinFunctionEntries` table and made the existing expression mapper consume the upstream catalog.
- Preserved all 94 existing mappings; this phase does not change the mapping outcomes.

## Remaining boundary

The mapper still owns the broader PHP AST traversal and other decisions, including static receiver/action mapping, Attribute factory recognition, anonymous class handling, and closure/body conversion. Eleven other scanner files still import `mapResourcePhpAstToUpstream` directly. They remain visible and are not claimed migrated or deleted in this phase.

## Verification

Run `node scripts/audits/phase1763-php-builtin-semantic-catalog.mjs` for the static contract audit. TypeScript typecheck, Vitest, and full build are intentionally not claimed as run in this environment.

> Superseded by Phase 1765. The catalog lookup interface was retired; run `node scripts/audits/phase1765-php-function-call-semantic-authority.mjs` for the current contract audit.
