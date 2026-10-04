# Phase 760 — Highest Upstream Dataflow AST Judgment

## Objective

Raise controller/data-flow semantics above the scanner AST boundary so semantic
analysis consumes a closed upstream ADT rather than free graph payloads.

## Laravel ecommerce-shop trace

The workload is the checked-in `examples/ecommerce-shop-source` application.

```text
Laravel source
  ├─ routes/api.php
  │    └─ POST /checkout -> OrderController::store
  ├─ app/Http/Requests/StoreOrderRequest.php
  │    └─ items.*.produk_item_id / items.*.qty / shipping_*
  ├─ app/Http/Controllers/OrderController.php
  │    └─ store / buyNow / addItem / updateItem / removeItem
  ├─ app/Models/Order.php
  │    └─ user / details / payment / shipping / promotion / amount / financial / fulfillment
  ├─ app/Models/ProdukItem.php
  │    └─ category / frontend / wishlists / reviews / orderDetails
  └─ app/Http/Resources/OrderResource.php
       └─ order -> payment / financial / fulfillment / amount / details / promotion / shipping
        ↓
PHP syntax evidence
        ↓
Closed PhpAstValue / PhpStatement evidence
        ↓
SemanticKnowledgeDataFlow
  ├─ dependency(source,target,role,guard)
  └─ value-flow(source,target,role,guard)
        ↓
AstDataflowJudgment
  ├─ typed identity
  ├─ typed entity role
  ├─ typed data-flow role
  ├─ dependency / value_flow
  └─ reaches least-fixed-point closure
        ↓
AstAnalysisJudgment
        ↓
resolver graph / type lowering / target projection
```

## Model elevation

`packages/core/src/types/upstream/astDataflowInterface.ts` is now the upstream
authority for data-flow. It contains no open predicate, subject, or payload slot.
The only semantic carriers are closed identities, closed roles, closed fact
variants, derivations, and a least-fixed-point closure.

`packages/core/src/compiler/analysis/astDataflowAuthority.ts` is the boundary
adapter from syntax-neutral `SemanticKnowledgeDataFlow` into that upstream ADT.
The scanner remains an evidence producer; it does not become the owner of the
upstream data-flow model.

`AstAnalysisJudgment` now requires `AstDataflowJudgment` and exposes its closure
as an explicit analysis fact. Analysis therefore cannot silently proceed with a
resolver judgment while carrying data-flow outside the AST semantic contract.

The cross-stage analysis vocabulary also has explicit relations for:

- `analysis_dataflow_dependency`
- `analysis_dataflow_value_flow`
- `analysis_dataflow_reaches`

## Validation ADT elevation

`ValidationFieldShape.scalar` now carries its `semanticType`. This removes the
old dead scalar witness in `relationVariantFold`: the exact scalar candidate is
now the semantic source for scalar validation nodes.

Collection-element scalar shapes carry their element semantic type as well.
Nested scalar shapes carry the leaf semantic type.

`collectRoots()` consumes the collection-element location witness directly.
Property-shape merging now consumes both residual branches instead of discarding
`existingRest` or `incomingRest`.

The result is a real shape-join algebra rather than a fold whose residual
branches merely satisfy TypeScript narrowing.

## Invariants

1. No parsed descriptor is introduced as a semantic authority.
2. PHP AST remains source evidence.
3. Data-flow has a closed upstream ADT.
4. Data-flow closure is explicit and least-fixed-point based.
5. Analysis receives data-flow as a typed premise.
6. Validation scalar/object/collection witnesses carry semantic information.
7. Location and residual shape witnesses participate in semantic construction.
8. Laravel ecommerce source remains a workload for the same closed algebra,
   not a second special-purpose ontology.
