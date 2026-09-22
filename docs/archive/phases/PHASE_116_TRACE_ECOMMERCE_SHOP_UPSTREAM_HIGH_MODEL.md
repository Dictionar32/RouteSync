# Phase 116 — ecommerce_shop → Upstream Resource Expression High Model

## Boundary

`ecommerce_shop PHP source → PHP AST → ResourceFieldExpression → ResourceExpressionModel → semantic binding → downstream`

This phase repairs the **interface/model boundary only**. It does not change generators or emitters.

## Source evidence

The real ecommerce_shop resources contain:

- `OrderResource`: `$this->payment?->status`, `$promotion?->discount_minor`, `$this->details`, nested `promotion` and `shipping` objects.
- `PaymentResource`: `$this->order?->promotion`, `$this->paymentDetail?->detail`, `$this->order?->order_number ?? $this->order_id`, nested gateway array access, `whenLoaded` closure, resource collection over `$this->order?->details`.
- `ProdukItemResource`: `$this->frontend?->gambar`, `asset(...)`, casts, `$this->category?->nama`.
- `OrderDetailResource`: `$this->produkItem`, `$produk->frontend?->gambar`, nested product object, arithmetic `$this->qty * $this->harga`.

The source therefore requires more than `expression + semanticType`. Property access, nullsafe access, method chains, variables, array access, static calls, function calls, casts, computation, conditionals, and nested objects all carry semantic binding requirements.

## Interface repair

Added:

- `packages/core/src/types/domain/resourceExpressionModel.ts`
- `packages/core/src/compiler/scanner/subscanners/resource/resourceExpressionOperator.ts`

`ResourceExpressionModel` now separates three states:

```text
known(type)
requires_binding(requirement)
rejected(reason)
```

`requires_binding` is a closed ADT. It preserves the complete receiver/operand tree instead of replacing unresolved meaning with `ErrorType`.

Binding requirements preserve:

- variable identity
- property name + access mode
- method name + arguments + access mode
- static model + method + arguments
- array target + index
- PHP function + arguments
- cast type + operand
- semantic operator + operands
- ternary branches
- short ternary
- null coalesce branches
- nested object fields

## Important correction

Previously, the mapper used `syntax_only` and fabricated `ErrorType` values for unresolved variables/static calls. That is information loss. The repaired model now says explicitly: **the expression exists, but semantic binding has not happened yet**.

It also removes the loose operator `Record` table from the mapper and moves the operator mapping into an exhaustive function.

## Dataflow examples

### `$this->order?->promotion`

```text
PHP AST property_access(nullsafe)
  ↓
ResourceFieldExpression
  ↓
ResourceExpressionModel
  semantic = requires_binding
  requirement = property {
    receiver = ResourceExpressionModel($this->order)
    property = PropertyName("promotion")
    access = nullsafe
  }
```

No regex and no downstream guessing are required to know what information is still needed.

### `$query->paginate(15)`

```text
method
  receiver = variable(query)
  method = paginate
  arguments = [literal(15)]
  access = direct
```

The model preserves the complete chain so the later binding phase can resolve:

`$orders → $query → Order::query() → paginate(15)`

without reconstructing syntax from strings.

### Nested response object

```text
nested_object {
  fields: [
    response_field("code") → ResourceExpressionModel(...),
    response_field("discount_minor") → ResourceExpressionModel(...)
  ]
}
```

The child models remain intact. The parent does not flatten them into a loose object or discard unresolved children.

## Remaining upstream boundary

The new model is currently introduced at the AST-expression mapper but is **not yet the sole input of `ResourceScanner` and all descriptor constructors**. Legacy descriptor construction still expects `semanticType`/`boundAst`.

Therefore the next repair must be:

`ResourceExpressionModel → ResourceFieldModel → binding contract → BoundSemanticNode`

with no `ErrorType` fabrication and no compatibility fallback as the canonical path.

Only after that boundary is closed should `SemanticTypeResolver`, response derivation, and lowerers be migrated.
