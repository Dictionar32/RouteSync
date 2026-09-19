# Phase 120 - ecommerce_shop upstream provenance repair

## Boundary

ecommerce_shop source -> PHP AST -> ResourceFieldExpression -> ResourceExpressionModel -> ResourceBindingModel -> provenance ADT -> BoundSemanticNode -> downstream

## Source evidence

- PaymentResource: `$this->order?->promotion`, `$this->paymentDetail?->detail`, `$this->order?->order_number`, `OrderDetailResource::collection($this->order?->details)`.
- ProdukItemResource: `$this->frontend?->gambar`, `$this->frontend?->rating`, `$this->category?->nama`.
- OrderDetailResource: `$produk->frontend?->gambar`.
- OrderResource: local variables and repeated nullsafe/coalesce model traversals.

## Repair

1. Added `resourceBindingProvenance.ts` with a closed origin/provenance ADT.
2. `ResourceBindingDefinitionModel` now carries explicit availability, preserving definite/branch/loop/catch semantics at the interface boundary.
3. `ResourceBindingModel` now carries provenance in addition to source and resolution.
4. `resourceBindingModelFactory` now constructs provenance from binding context and detects cyclic variable provenance instead of silently flattening it.
5. Exported the new domain models through `types/domain/index.ts`.

## Dataflow target

`$orders -> definition #2 -> $query -> definition #1 -> Order::query() -> Order`

Multiple definitions are retained in the variable origin. A single definition is traversable; ambiguous/multiple definitions remain represented as provenance data rather than selecting an arbitrary definition.

## Verification

Focused TypeScript output contains no diagnostic for the newly changed provenance/model/factory files. The narrow project check still reports an unrelated pre-existing `RequestField` diagnostic in `types/domain/index.ts`.

## Boundary intentionally not changed

SemanticTypeResolver, response derivation, lowerers, emitters, and other downstream consumers were not modified in this phase.
