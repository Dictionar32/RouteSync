# Phase 133 - High Model Interface Trace

## Correction of direction

This phase does not treat interface work as adding missing properties. The upstream contract must be raised from syntax-shaped DTOs into semantic domain models so downstream can consume meaning directly.

## Target flow

SOURCE ecommerce_shop -> PHP AST -> Semantic Domain ADT -> Manifest -> locked downstream

The AST remains an origin representation. It must not leak positional syntax into the semantic model.

## Array model elevation

Previous semantic shape:

ResourceArrayExpression { element }

Raised model:

ResourceArrayExpression
- cardinality: sequence | map
- entries: ResourceArrayEntry[]

ResourceArrayEntry
- key: implicit | string | integer | expression
- value: ResourceExpressionModel

This preserves cardinality, sibling entries, and key semantics.

## Relation-load model elevation

Previous query model:

relation_load -> target

Raised query model:

relation_load -> targets[] -> RelationLoadTarget

Each target carries relation path and selection semantics. `with([...])` therefore remains a collection of relation specifications instead of collapsing to the first string.

## Important distinction

The remaining `ResourceExpressionModel { expression, semantic }` is still an intermediate compatibility model. It is not yet the final high semantic expression ADT because it retains the raw expression alongside a generic semantic status.

Next upstream blocker is therefore to replace this wrapper with explicit semantic expression variants, for example:

PrimitiveValue
ModelReference
ResourceReference
ObjectValue
ArrayValue
PropertyRead
MethodInvocation
BinaryComputation
ConditionalValue
NullCoalescingValue
LiteralValue
UnsupportedSource

Each variant must carry the complete information required by downstream and must not require downstream re-parsing of the raw AST.

## Collections

`semanticCollections.ts` still contains generic maps with `unknown` defaults. Those are containers, not sufficiently modeled domain contracts. They remain locked from downstream consumption until each collection is raised to a concrete domain vocabulary.

## Verification

Narrow TypeScript check reports no diagnostics in the Phase 133 touched expression/query files. Existing repository-wide legacy diagnostics remain elsewhere and were not hidden with `any` or fallback values.
