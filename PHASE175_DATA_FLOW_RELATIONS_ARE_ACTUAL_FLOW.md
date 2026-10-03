# Phase 175 — Data-flow relations are actual flow

## Principle

The canonical semantic model stores semantic knowledge as typed facts. Relations are reserved for data dependencies and actual value flow. They must not restate fields already present on a fact.

## Changes

The canonical relation vocabulary is now:

- `depends_on`: a fact requires another knowledge item as an input/dependency.
- `flows_to`: a produced value is transferred into another knowledge item.

Removed from the canonical semantic model:

- `derived_from` — operator definitions are already referenced by typed operation facts.
- `produces` — producer/target structure is represented by the iteration fact and does not need a graph edge.
- `consumes` — invocation arguments are already explicit in the invocation fact; invocation depends on them.
- `transforms` — loop/update structure is explicit in the iteration fact.
- `assigns` — assignment already explicitly contains `target` and `value`; actual assignment flow is `value -> target` via `flows_to`.

## Assignment semantics

For:

```php
$total = $price;
```

the canonical knowledge is an `assignment` fact containing both `target` and `value`, while the data-flow graph contains:

```text
value --flows_to--> target
```

The assignment fact itself does not need an `assigns` edge to restate that knowledge.

## Operator semantics

`SemanticUnaryOperation` and `SemanticBinaryOperation` already carry their operator knowledge explicitly. Therefore the graph does not add a `derived_from` edge merely to point back to an operator fact. Operand dependencies remain `depends_on`.

## Result

The canonical model no longer treats generic relation labels as a substitute for typed semantic structure. A relation now answers a narrower question: **does information depend on another item, or does a value actually flow into another item?**
