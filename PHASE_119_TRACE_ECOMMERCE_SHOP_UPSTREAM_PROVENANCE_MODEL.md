# Phase 119 - ecommerce_shop upstream provenance model

## Boundary

ecommerce_shop source -> PHP AST -> ResourceFieldExpression -> ResourceExpressionModel -> ResourceBindingModel -> provenance-ready ADT -> downstream later.

## Source evidence

PaymentResource.php contains `$this->order?->promotion`, `$this->paymentDetail?->detail`, `$this->order?->order_number`, and `OrderDetailResource::collection($this->order?->details)`.

## Repair

`ResourceBindingModel` now carries a closed `ResourceBindingDefinitionIdentity` / `ResourceBindingVariableOrigin` model. A variable root is explicitly `unresolved` until controller dataflow resolution supplies its definition provenance. Definition identity distinguishes parameter, local, branch, loop, catch, and external origins.

The controller dataflow contract's table origin now uses the domain `TableName` value object instead of a free string.

The resource binding factory preserves variable-origin state instead of emitting a bare variable root.

## Important invariant

The upstream model does not classify a member as an Eloquent relation merely from syntax. It first preserves member/method structure and provenance. Relation classification belongs to symbol/model resolution after the complete upstream model exists.

## Remaining upstream work

Connect `ControllerDataflowContract` into `ResourceBindingModel` resolution so `$orders -> $query -> Order::query()` carries concrete definition identity and model provenance. Branch/loop versions must remain distinguishable rather than collapsing to a variable name.

No downstream resolver, lowerer, or emitter was changed in this phase.
