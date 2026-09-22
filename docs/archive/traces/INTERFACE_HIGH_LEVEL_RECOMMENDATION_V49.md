# High-Level Interface Recommendation — V49

## Gate

Production interface shape must not be widened from the current trace.

## Existing owner

`ModelSemanticNode` already owns model meaning through:

`ModelSemanticNode.facts: ModelFacts`

The proven semantic ownership remains nested:

- `ModelFacts.identity`
- `ModelFacts.key`
- `ModelFacts.behavior`
- `ModelFacts.exposure`
- `ModelFacts.capabilities`
- `ModelFacts.surface`

## Do not add

Do not add duplicate top-level fields such as:

- `ModelSemanticNode.key`
- `ModelSemanticNode.behavior`
- `ModelSemanticNode.exposure`
- `ModelSemanticNode.capabilities`
- `ModelSemanticNode.surface`

## Required high-level connection

The trace proves:

`Laravel source → PhpClassPropertyAst → ModelFacts → ModelAst`

The first-loss is now:

`ModelFacts/ModelAst → ModelSemanticNode`

The required repair is therefore a producer connection using the existing types, not a new interface.

## Fail-closed rule

If the producer cannot be connected from an existing `ModelAst`/`ModelFacts` value, no interface field may be invented.
