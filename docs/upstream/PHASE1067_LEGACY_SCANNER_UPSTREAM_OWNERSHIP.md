# Phase 1067 — Legacy StaticLaravelScanner Upstream Ownership

`StaticLaravelScanner` remains a backward-compatible facade, not the owner of upstream source-project identity construction.

## Boundary

```text
upstream sourceProjectIdentity
        │
        ▼
ManifestBuilderInterface / manifest producer
        │
        ▼
downstream wiring
        │
        ├── ServiceGraphBuilderInterface
        └── DataFlowProjectionInterface / IR
```

`createLaravelSourceProjectIdentity` is now implemented in `types/upstream/sourceProjectIdentity.ts`. `StaticLaravelScanner` only re-exports it for compatibility.

The CLI production path continues to consume `manifestBuilder` and does not import the legacy scanner facade.

## DataFlow rule

`DataFlowInterface<Input, State, Node>` remains generic execution/state/query vocabulary. Laravel source identity, route/controller/request/resource/model/schema policy, and legacy scanner compatibility do not belong inside it.

`InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned: wiring/projection consumes upstream values and materializes downstream contracts. Upstream types do not implement the boundary merely to be consumed.
