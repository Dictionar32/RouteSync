# Phase 174 — Expression Knowledge Closure

## Principle

RouteSync raises semantic knowledge into typed data. Syntax is evidence; data-flow is dependency; execution/control-flow is derived.

## Change

The canonical semantic model no longer uses generic `expression` / `opaque_expression` value kinds as a semantic source of truth.

The producer now materializes typed facts for expression knowledge that was previously downgraded or left opaque:

- interpolated strings
- resource access
- casts
- arrays and array entries
- static invocation
- construction and dynamic construction
- `instanceof` type checks
- class references
- class constants
- magic constants
- closures
- arrow functions
- anonymous class construction
- explicitly unsupported expressions

`unsupported-expression` is explicit knowledge of an analysis gap. It is not a fake semantic value and is not interpreted as a control-flow edge.

## Data-flow rule

Facts contain semantic structure. Relations contain dependencies between those facts.

For example:

```text
Cast
  operand ───────────────► Knowledge

StaticInvocation
  arguments ─────────────► Knowledge

Construction
  classExpression ──────► Knowledge
  arguments ─────────────► Knowledge
```

The graph does not need execution edges to recover the meaning of these expressions.

## Tree-sitter boundary

Tree-sitter remains syntax evidence. Its concrete syntax tree describes grammar/syntax nodes; the semantic producer raises those nodes into RouteSync knowledge rather than mirroring their names.

## Remaining boundary

Declaration/type semantics and class members require their own typed knowledge model. They must not be reintroduced as generic expression values merely to make the expression producer total.
