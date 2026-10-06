# Phase 1085 — Downstream Wiring Surface Closure

## Scope

This phase traces the upstream → wiring → downstream boundary across:

- `packages/core/src/types/upstream/**`
- CLI `scan` / `sync` commands
- `examples/ecommerce-shop-source`
- legacy `StaticLaravelScanner`
- manifest, route, controller, model relation, resource, schema, graph, dataflow, and IR surfaces

## Findings

1. `StaticLaravelScanner.ts` remains removed and has no TypeScript references.
2. `RouteSyncManifest` remains a construction artifact containing `CompleteSourceAst`.
3. `RouteSyncManifestFlow` remains the downstream manifest carrier and is AST-free.
4. `InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned and directional.
5. `ServiceGraphBuilderInterface` continues to consume `RouteSyncManifestFlow` for structural/provenance graph materialization.
6. `DataFlowInterface` remains domain-neutral and is not widened with Laravel vocabulary.
7. Dataflow orchestration previously inspected `RouteSyncManifestFlow.sourceModel` to recover controller/action identity. This phase removes that downstream coupling.
8. A downstream-owned `RouteSyncManifestDataflowProjectionInterface` now projects the manifest flow into an AST-free, dataflow-specific surface containing canonical `dataflowInputs` plus controller/action identity.
9. `scan` and `sync` build the concrete manifest once, project to `RouteSyncManifestFlow` once, and then project that flow to the dataflow-specific surface before analysis.
10. IR remains downstream of the canonical dataflow projection and does not become a second closure authority.

## Resulting boundary

```text
Laravel upstream evidence
        |
        v
RouteSyncManifest (construction + AST)
        |
        | RouteSyncManifestFlowProjectionInterface
        v
RouteSyncManifestFlow
        |\
        | \
        |  +--> ServiceGraphBuilderInterface --> ServiceGraph
        |
        +----> RouteSyncManifestDataflowProjectionInterface
                    |
                    v
          RouteSyncManifestDataflowSurface
                    |
                    v
          SemanticDataflowRuntimeBoundary
                    |
                    v
             generic DataFlowInterface
                    |
                    v
                    IR
```

## Ecommerce evidence policy

The ecommerce fixture confirms the intended distinction:

- `$request->user()->id` and its use in `Order::where('user_id', ...)` are explicit value-flow evidence.
- `OrderResource` construction/collection is response projection evidence.
- `Order` relationships such as `details`, `payment`, `shipping`, and `promotion` are structural/serialization evidence, not automatic value-flow edges.
- migration foreign keys such as `orders.user_id` and `order_details.order_id` are schema/provenance evidence, not automatic value-flow edges.

Laravel's official documentation confirms that loaded Eloquent relationships participate in recursive serialization, while API Resources form a transformation layer between Eloquent models and JSON responses. CodeQL similarly separates the generic data-flow solver from source/sink/additional-flow-step configuration. MLIR's interface model supports keeping generic analyses decoupled from concrete domain operations.

## Validation

Passed:

- Phase 1074 legacy scanner removal audit
- Phase 1075 interface closure audit
- Phase 1082 manifest-flow boundary audit
- Phase 1084 upstream-wiring command audit
- Phase 1085 downstream-wiring surface audit

The full TypeScript build was not executed because `node_modules/.bin/tsc` / `node_modules/.bin/tsup` is unavailable in this workspace. The checkpoint therefore records audit-level validation, not a claim of a full build pass.
