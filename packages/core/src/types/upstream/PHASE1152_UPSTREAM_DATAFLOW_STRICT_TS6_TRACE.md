# Phase 1152 — Upstream DataFlow Strict Type Boundary

## Architecture

Laravel source evidence flows through `CompleteLaravelSourceModel` into upstream semantic contracts, then through the typed wiring adapter into generic `DataFlowInterface<Input, State, Node>`. Graph remains a separate structural relation lane and IR consumes canonical dataflow state without recomputing closure.

## Strengthening

- `DataFlowInterface` remains domain-neutral and interface-first.
- `DataFlowExecutionInterface` explicitly composes source, step, and fixpoint capabilities.
- `tsup` now explicitly emits ES2025.
- Root and ecommerce frontend TypeScript configurations use ES2025 + strict TypeScript 6.
- Graph assembly preserves `ModelName`, `PropertyName`, and `VariableName` instead of widening entries to `string`/`unknown`.
- Upstream `RouteBindingInterface` consumes `RouteParameters.items` through the canonical collection boundary.
- `SchemaRelationInterface` now carries canonical `primaryColumns`, preventing reconciliation from reaching back into `SchemaTable`.
- `CompleteLaravelSourceModel` relation projection consumes the canonical semantic relation interface.
- Controller semantic dataflow projection uses typed relation expansion rather than `Sequence.flatMap` leakage.

## External grounding

TypeScript 6 officially supports `es2025` for both `target` and `lib`, and defaults increasingly favor modern ESM/strict development. MLIR uses interfaces to keep analyses generic over concrete operations, while its data-flow solver owns orchestration/fixpoint/state. CodeQL distinguishes semantic data-flow graph nodes from AST nodes. These references support keeping RouteSync's generic dataflow runtime separate from upstream Laravel semantic meaning.
