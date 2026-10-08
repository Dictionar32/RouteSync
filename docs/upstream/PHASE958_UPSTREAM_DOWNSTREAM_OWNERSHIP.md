# Phase 958 — Upstream / Downstream Ownership and End-to-End Trace

## Canonical chain

`examples/ecommerce-shop-source` → `StaticLaravelScanner.scan` → `controller.semantic.dataflow` → `analyzeSemanticDataflowInput` → `createSemanticDataflowJudgment` → least-fixed-point closure → `semanticDataflowInterfaceFromJudgment` → `analyzeRouteSyncManifestDataflow` → CLI `scan` / `sync` → `routesync.dataflow.json`.

## Ownership result

- `types/upstream` has zero production reverse imports into compiler/scanner/graph/IR/kernel.
- `semantic/kernel` has zero imports from scanner/compiler scanner.
- Six scanner-dependent contract tests were moved out of `types/upstream/__tests__` into `compiler/scanner/__test__/upstream-contracts` so the upstream contract package is no longer the owner of scanner implementation tests.
- Six proven-unreferenced legacy/archive production files were vacuumed to intentional empty stubs. Active compatibility files (`legacyResolver.ts`, `legacyConverter.ts`) were retained because they are still referenced by compatibility boundaries.

## Laravel semantic split

Laravel policy/middleware evidence remains in semantic policy relations and structural graph projection. Controller value/dataflow evidence remains in `SemanticDataflowInput` and its canonical judgment/interface. These are separate authorities and are not collapsed into one generic channel.

## Runtime status

Static source-to-sink wiring is proven by repository audits and production E2E test definitions. Runtime Vitest execution is not claimed in this workspace because `node_modules` is absent.


## Phase 959 correction — canonical physical E2E fixture

The scanner ownership E2E and production dataflow E2E now both consume the same physical source tree:

`examples/ecommerce-shop-source`

The production dataflow test now enters through `analyzeRouteSyncManifestDataflow(manifest)` instead of invoking the lower-level `analyzeSemanticDataflowInput` directly. This proves the downstream orchestration boundary consumes the scanner-produced controller dataflow and returns the canonical `SemanticDataflowInterface`.

The older `sdk/tests/fixtures/ecommerce-shop-source` remains only in the Phase 760 low-level AST workload test, where it is intentionally used as a parser/knowledge fixture rather than the production E2E source. It is therefore not treated as dead legacy by the vacuum audit.
