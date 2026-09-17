# Interface Trace Audit — Phase 86.1

## Origin evidence: ecommerce_shop

The traced manifest contains real Laravel controller expressions using closure bindings, including:

- `OrderDetail::where(...)->whereHas('order', function ($query) use ($request) { ... })`
- named associative-array keys such as `'produk_item_id' => $produk->id`
- ordinary positional method arguments such as `'paid'`

The source AST therefore needs to preserve argument role as structure, not merely preserve the argument value.

## Defect found

Phase 86 introduced `PhpArgument` with three cases:

- `positional`
- `named`
- `unpacked`

But `PhpAstFolder<R>` immediately collapsed each `PhpArgument` into `R`. That erased the very syntactic distinction Phase 86 had introduced.

This created a dataflow loss:

`PhpArgument ADT -> fold -> R[]`

The downstream folder could no longer distinguish a named argument from a positional or unpacked argument.

## Repair

Introduced `FoldedPhpArgument<R>`:

```ts
type FoldedPhpArgument<R> =
  | { kind: 'positional'; value: R }
  | { kind: 'named'; name: PhpPropertyName; value: R }
  | { kind: 'unpacked'; value: R };
```

All call-folding operations now receive `readonly FoldedPhpArgument<R>[]`.

The fold remains bottom-up, but no longer destroys argument binding semantics.

## Invariant

> Folding a PHP AST may transform node values, but it must not erase syntactic distinctions that are represented by the AST ADT.

This keeps the AST a semantic carrier rather than a lossy preprocessing step.
