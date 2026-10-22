# RouteSync Phase 2474 — Existing Resource Scan Contract Wiring

## Scope

Baseline: Phase2473 ZIP. This phase intentionally reuses `LaravelResourceScannerInterface` and `ResourceModelBindingJudgmentAuthority`; it adds no duplicate upstream interface and moves no files.

## Trace

`LaravelResourceScannerInterface.scan`
→ `laravelResourceScanner.scan`
→ `createScan(resourceModelBindingAuthority)`
→ `bindingAuthority.judgeBatch(...)`
→ closed binding closure
→ resource AST projection via `resourceProducer.produceResult(...)`.

The scanner contract already declares source-bound `relationEvidence`. The scanner forwards `input.relationEvidence` into `judgeBatch` and does not silently augment the semantic input from Resource AST parsing. `ResourceModelBindingJudgmentAuthority.judgeBatch` owns the binding closure before AST projection. The implementation previously left the internal `createScan` operation inferred; this phase explicitly binds it to `LaravelResourceScannerInterface['scan']` so the existing upstream operation contract governs the runtime boundary.

## Changed

- `packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts`: `createScan` now explicitly returns `LaravelResourceScannerInterface['scan']`.
- `scripts/audits/audit-phase2474-existing-resource-scan-contract-wiring.cjs`: new 8-check trace audit.
- `package.json`: registers `audit:phase2474-existing-resource-scan-contract-wiring`.

No upstream contract files were added. No files were moved.

## Verification

- Phase2474 audit: 8/8 passed.
- Phase2473 audit: 10/10 passed.
- Phase2472 audit: 10/10 passed.
- Phase2472 smoke: 4/4 passed.
- Package JSON parses successfully.
- ZIP integrity checked after packaging.

## Remaining frontier — not claimed fixed

Static source inventory of `packages/core/src/compiler/scanner/subscanners` (excluding test files):

- Direct imports from `semantic/foundation`: 0 files.
- Direct imports from `semantic/relations`: 35 files.
- `export function` declarations: 43.

The relation imports and exported functions are not mechanically rewritten in this phase. Each needs a consumer/contract trace so an existing upstream owner can be wired instead of creating duplicate interfaces or replacing semantic operations with unrelated helpers. In particular, `resourceFieldProducer.ts` and `twoPassRelationResolver.ts` remain open resource-subscanner frontiers. Full typecheck, Vitest suite, package build, and end-to-end CLI were not run.
