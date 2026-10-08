# Phase 179 — Semantic Data-Flow Roles

## Principle

RouteSync's canonical model raises semantic knowledge into typed data. Tree-sitter/scanner syntax is evidence only; it is not the semantic source of truth.

Phase 179 removes a remaining semantic collapse in the data-flow layer:

```text
before
  dependency(source, target)

after
  dependency(source, target, role)
  value-flow(source, target, role)
```

The role describes semantic participation, for example:

- `operator`
- `operand_left`, `operand_right`, `operand`
- `receiver`, `index`, `argument`, `callable`
- `array_key`, `array_value`
- `predicate`, `branch_condition`, `branch_outcome`
- `subject`, `body`, `initializer`, `condition`, `update`, `iterable`, `target`
- `transition_value`, `exception_type`, `handler`, `finally_block`

These are semantic roles, not Tree-sitter node names and not execution-order edges.

## Additional semantic elevation

Phase 179 also raises:

- assignment operator (`set`, `add`, `subtract`, etc.)
- assignment reference mode (`by_value`, `by_reference`)
- `include`, `include_once`, `require`, `require_once`
- `unset` targets

The scanner statement algebra now exposes `unset_statement` and `include_statement` explicitly instead of silently dropping those statement variants at the visitor boundary.

## Control-flow boundary

No CFG vocabulary was added. In particular, roles do not encode:

- successor/predecessor
- re-entry
- execution order
- branch-to edges
- return/throw/catch control edges

`if`, `while`, `for`, `foreach`, `switch`, and `match` remain semantic facts. Their conditions, subjects, bodies, alternatives, and outcomes participate in typed data-flow only through semantic roles.

## Source of truth

Canonical:

1. `facts`
2. `dataFlow`
3. semantic vocabularies/catalogs

Derived:

- `relations`
- `Map`/`Set` indexes used for lookup or validation
- string identity keys

The derived graph edge remains a compatibility projection and does not regain authority over the semantic model.
