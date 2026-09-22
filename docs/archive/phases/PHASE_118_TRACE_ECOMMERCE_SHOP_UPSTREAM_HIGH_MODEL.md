# Phase 118 - ecommerce_shop upstream high-model interface trace

## Boundary

ecommerce_shop PHP source -> PHP AST -> ResourceFieldExpression -> ResourceExpressionModel -> ResourceBindingModel -> BoundSemanticNode -> downstream.

## Source evidence

- `app/Http/Resources/PaymentResource.php` contains `$this->order?->promotion`, `$this->paymentDetail?->detail`, `$this->order?->order_number`, and `OrderDetailResource::collection($this->order?->details)`.
- `app/Http/Controllers/ProductReviewController.php` contains a `paginate($perPage)` query flow.

## Findings

1. Expression mapping already preserves nested expression trees through `ResourceExpressionModel`.
2. Binding requirements preserve receivers, methods, arguments, access mode, casts, computation, conditionals, null-coalesce, and nested fields.
3. Binding model previously treated `$this` as an ordinary variable. This loses the semantic distinction between controller context and a local variable.
4. `ResourceBindingRoot` is therefore repaired with a closed `controller_this` variant. `$this` is classified only at the interface boundary; model/relation resolution remains a later symbol-resolution concern.
5. Unresolved traversal steps remain deliberately neutral (`member` and `method`). They do not prematurely claim that a member is an Eloquent relation.
6. Resolved steps retain `BoundStepEdge`, which carries source model, step meaning, nullsafe, semantic type, target model, and cardinality.

## Canonical examples

`$this->order?->promotion`

controller_this -> member(order, nullsafe) -> member(promotion, nullsafe)

`OrderResource::collection($orders)`

model(OrderResource) -> method(collection, argument=$orders)

`$orders = $query->paginate(15)`

variable(orders) -> dataflow definition -> method(paginate, argument=15) -> variable(query) -> model(Order) -> method(query)

The last chain is not yet resolved in this phase. The upstream interface now has enough structure to perform that resolution without reparsing source strings.

## Remaining upstream boundary

The next repair is the dataflow provenance model: a variable reference must carry a closed definition identity/version path so `$orders` can resolve through `$query` to `Order::query()` and `paginate(15)`. Branch and loop versions must remain distinguishable. Only after this provenance is complete should the resolver create `BoundStepEdge` and target/cardinality facts.

## Rule

No downstream resolver, lowerer, emitter, or fallback inference is changed in this phase.
