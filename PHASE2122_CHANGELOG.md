# Phase 2122 — Interface-first CLI route-source selection

## Scope

This phase closes a concrete gap found in the CLI trace: `scan --input` and `sync --input` were declared but not propagated to the route scanner. The option therefore did not select the file consumed by the scanner.

## Contract change

- Added `LaravelRouteSourceSelection`, a discriminated union that separates scan intent from `SourceProjectIdentity`.
- Added `LaravelRouteSourceSelectionInterface` and `laravelRouteSourceSelectionAuthority` as the constructor boundary for default or explicit route selection.
- Extended the manifest-builder, source-AST scanner/pipeline, and route-scanner interfaces with an optional route-source selection.
- Kept the selection optional for existing callers; absence preserves project defaults (`routes/api.php` and `routes/web.php`).
- `scan --input` and `sync --input` now resolve the selected path against the project root and pass an explicit route-source selection through composition, manifest builder, AST pipeline, and route scanner.
- The route scanner no longer owns the explicit selection policy; it consumes the typed ADT.

## Semantic ownership

The selection is intentionally not embedded in `SourceProjectIdentity`: project identity and per-run scan intent are different concepts. The CLI selects the input; the core scanner consumes that selection. Invocation judgment, inventory closure, action judgment, integrated response judgment, and runtime executor ownership are unchanged.

## Known remaining issue

`--models` is still declared on CLI commands but the canonical source-AST pipeline scans models unconditionally because controller semantic analysis depends on model identities. That option needs a separate contract decision: either remove the misleading toggle or define what model output is optional without weakening required semantic evidence.

## Validation

Run the static contract audit from the repository root:

```sh
node scripts/audits/phase2122-cli-route-source-selection.audit.mjs
```

The audit verifies interface-to-runtime propagation. No package build was run in this environment.
