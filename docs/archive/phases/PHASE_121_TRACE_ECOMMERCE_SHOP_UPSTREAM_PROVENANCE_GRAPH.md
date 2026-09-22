# Phase 121 Trace: ecommerce_shop → Upstream Provenance Graph

## Boundary

`ecommerce_shop source → PHP AST → ResourceExpressionModel → ResourceBindingModel → ResourceBindingProvenance → downstream`

## Repair

- ResourceBindingProvenanceNode now stores `definitions[]` instead of an optional receiver pointer.
- Variable provenance preserves every candidate definition, including branch/loop/catch versions.
- Definition expressions remain attached to provenance, so `$orders → #2 → $query → #1 → Order::query()` can be represented without choosing one definition early.
- Provenance origin is a closed ADT and includes an explicit `expression` origin for non-variable roots instead of inventing an external variable.
- Cycle detection remains explicit as a rejected ADT state.
- The previous `selectDefinition()` single-definition collapse was removed from provenance construction.

## Source-driven target

For `$query = Order::query(); $orders = $query->paginate(15); return OrderResource::collection($orders);`, provenance must preserve definition #2, its receiver `$query`, definition #1, and `Order::query()` as a connected graph.

For `$this->order?->promotion`, `$this` is represented as `controller_this`; property/relation classification remains deferred until model/symbol resolution.

## Boundary intentionally not changed

SemanticTypeResolver, response derivation, lowerers, emitters, and other downstream consumers are not modified in this phase.

## Verification

Focused narrow TypeScript diagnostics were filtered for the four modified binding/provenance files. No diagnostics were reported for those files. Repository-wide compilation is not claimed green because unrelated existing diagnostics remain elsewhere.
