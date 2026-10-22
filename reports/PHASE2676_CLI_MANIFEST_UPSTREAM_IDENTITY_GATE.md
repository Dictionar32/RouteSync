# Phase 2676 — CLI / Manifest / Upstream Identity Gate

**Result: 208/208 structural assertions passed across 17 audit scripts.** This is a source-structure result, not a build or runtime result.

## Source-level correction

The inventory-to-AST check introduced in Phase 2675 was mandatory only inside conflict-ledger closure. The verifier's contribution-replay path did not enforce it before judgment dispatch, leaving a gap for non-conflict judgments. Phase 2676 moves the check to the top of `requestTypeDerivationProofVerifier.verify`, before all judgment-specific branches. Invalid inventory now produces a typed verification-stage producer-gap error; it is not normalized or silently repaired.

The patch also repairs a literal escaped newline in the import list and updates three stale structural audit predicates (Phases 2657, 2659, 2664) whose assertions no longer matched the current source shape.

## CLI → manifest → upstream path

`scan` and `sync` consume the same injected manifest authority and semantic pipeline, build a `routeManifestRequestResolutionPreflight`, pass that exact packet to authority-backed projection, and lower the manifest only when the result is `projected`. A blocked semantic result remains explicit; no legacy `RequestType[]` fallback is added.

## Verification boundary

- Structural audit scripts: **208/208 pass** across 17 audits.
- TypeScript compilation: **not run** (`node_modules/.bin/tsc` absent).
- Vitest: **not run** (`node_modules/.bin/vitest` absent).
- Laravel runtime `scan`/`sync`: **not run** (`examples/ecommerce-shop-source/vendor/autoload.php` absent).
- Full canonical semantic-law verification: **still incomplete**.

The next correct step is to restore the project toolchain, add a runtime regression that forges inventory on a non-conflict inference, then run typecheck, focused Vitest, and real CLI scan/sync on the ecommerce Laravel fixture.
