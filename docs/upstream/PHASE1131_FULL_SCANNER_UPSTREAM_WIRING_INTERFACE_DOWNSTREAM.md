# Phase 1131 — Full Scanner Surface: Upstream → Wiring → Interface → Downstream

## Correction

The scanner surface must not be described as only route/controller/model. The scanner is a broad source-evidence producer. The canonical upstream model then normalizes that evidence into a smaller semantic vocabulary and catalog.

## Scanner evidence surface

The current scanner orchestration includes evidence producers for:

- route
- controller
- model
- model property / relation
- resource
- request / FormRequest
- response
- service
- provider
- channel
- migration
- middleware
- DTO
- attribute
- schema
- query
- expression / assignment / property evidence

These are scanner/evidence concerns. They are not all independent downstream semantic interfaces.

## Canonical upstream catalog

`CompleteLaravelSourceModel` carries the normalized domain catalog:

```text
controllers
providers
models
resources
requests
responses
services
routes
channels
```

The canonical semantic relation vocabulary then connects these domains where the relationship is semantically established. `model_relation` and `schema` remain structural evidence and are not automatically converted into runtime value-flow producers.

## Canonical direction

```text
source files
  ↓
scanner / parser / evidence producers
  ↓
upstream semantic construction
  ↓
CompleteLaravelSourceModel
  ↓
RouteSyncManifest
  ↓  explicit construction-to-flow lowering
RouteSyncManifestFlow                 (AST-free)
  ├───────────────┬───────────────────────┐
  ↓               ↓                       ↓
Graph surface   Dataflow seed surface    IR input
  ↓               ↓                       ↓
Graph relation   SemanticDataflowInput    IR projection
  ↓               ↓                       ↓
Graph builder    DataFlowInterface        downstream IR
                ↓
                closed semantic judgment
```

## DataFlowInterface

Keep `DataFlowInterface<Input, State, Node>` generic. It composes source, state, step, fixpoint and query capabilities. It must not acquire Laravel route/controller/model/resource/schema vocabulary.

Framework policy belongs in upstream semantic facts and analysis configuration. This mirrors CodeQL's separation between a generic dataflow API and configuration that declares sources/sinks/flow behavior, while MLIR similarly exposes generic interfaces so analyses do not encode concrete dialect knowledge. See CodeQL modular dataflow and MLIR interfaces.

## InterfaceDependencyBoundary

Keep the downstream-owned directional boundary:

```ts
interface InterfaceDependencyBoundary<Upstream, Downstream> {
  readonly project: (upstream: Upstream) => Downstream;
}
```

Upstream types must not import or implement this boundary merely to be consumable downstream. Projection implementations belong to the wiring/downstream side.

## Dataflow producer distinction

Runtime producer lineage currently distinguishes:

```text
request | route | controller | resource
```

Structural evidence such as:

```text
model_relation
schema
```

must remain structural/provenance evidence unless an explicit upstream semantic projection proves value flow. This prevents graph/schema relations from becoming fake runtime dataflow.

## Legacy scanner

`StaticLaravelScanner` and `LaravelScanner` are not production authorities. The legacy surface is retained only where historical compatibility/audit artifacts require it; production scanner construction is owned by `manifestBuilder` and the upstream source-model construction path.

## CLI

CLI commands consume the package surface from `@routesync/core`. They orchestrate:

```text
manifestBuilder
→ RouteSyncManifestFlow
→ graph/dataflow/IR projections
→ generated artifacts
```

They do not import `packages/core/src` internals and do not become semantic authorities.

## External design alignment

Tree-sitter treats the parser as a syntax-tree producer, not the semantic authority. Soufflé treats relations as declared data/analysis inputs and derives relations through rules. SeaHorn separates front-end, middle-end and back-end representations. K organizes semantic definitions into modules and rules. These support the same architectural principle: preserve explicit boundaries between syntax/evidence, semantic meaning, analysis execution and downstream representations.
