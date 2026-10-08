# Phase 1079 — Upstream Flow / CLI / Wiring Boundary Trace

## Canonical path

Laravel source -> upstream semantic producers -> RouteSyncManifest -> RouteSyncManifestFlow -> downstream wiring/projections.

`RouteSyncManifest` owns the concrete construction artifact including `CompleteSourceAst`.
`RouteSyncManifestFlow` is the downstream semantic handoff and does not expose `ast`.

## CLI finding

`packages/cli/src/commands/scan.ts` and `sync.ts` correctly build the concrete manifest once, then derive the canonical `RouteSyncManifestFlow` from that same manifest. This avoids a second scan.

The dataflow production function requires `SemanticDataflowRuntimeBoundary`; both CLI commands now pass the canonical `semanticDataflowRuntimeBoundary` instead of weakening the analysis signature.

## Boundary ownership

- Upstream: `ManifestBuilderInterface` produces `RouteSyncManifest`.
- Upstream handoff: `RouteSyncManifestFlow` carries resolved source model and controller-scoped `dataflowInputs`.
- Graph wiring: `ServiceGraphBuilderInterface extends InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>`.
- Dataflow wiring: semantic authority is adapted to generic `DataFlowInterface`; runtime composition implements the downstream boundary.
- IR wiring: `DataFlowProjectionInterface` consumes the canonical generic dataflow contract.
- CLI: orchestration only; it does not reclassify Laravel syntax or implement semantic closure.

## Laravel fixture classification

- Route declarations: route semantic evidence.
- Controller/request expressions: value/dataflow evidence when explicit value propagation exists.
- Model relations: structural/provenance evidence; not automatically dataflow.
- Resources: response/projection evidence; only explicit reads/projections become dataflow evidence.
- Schema/FKs: structural/provenance evidence; not automatically value-flow.

## Legacy scanner

No active TypeScript references to `StaticLaravelScanner` were found under `packages/core/src` or `packages/cli/src`.

## Cleanup rule

A legacy file is only eligible for emptying after its incoming consumer references reach zero. Paths are retained; files are not deleted.

## Validation limitations

The workspace does not contain the historical `scripts/audits/*.cjs` files referenced by package scripts, and it has no package-local TypeScript config. Therefore historical audit commands cannot be executed here and are not treated as architecture failures.
