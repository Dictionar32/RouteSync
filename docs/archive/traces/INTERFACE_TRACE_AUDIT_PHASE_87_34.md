# Phase 87.34 — Verified Upstream / Projection Dataflow Repair

## Objective
Close the semantic boundary so Laravel AST facts are verified once upstream and
remain typed downstream. Query projections must not be reclassified as model
columns, and `first()` must preserve projection identity while changing
cardinality/nullability.

## Changes
- `ModelNode` is now the strict semantic-kernel model contract.
- `ModelNodeInput` is the legacy/raw scanner compatibility boundary.
- `verifyModelNode()` normalizes legacy optional model shapes exactly once at the
  kernel boundary.
- `ResolutionContext` no longer carries `unknown` context models.
- `SemanticResolutionKernel` accepts raw model inputs only at construction/load
  and immediately verifies them.
- Query projection resolution now carries `cardinality` and `nullable`.
- `selectRaw()` creates a collection/non-null projection.
- `first()` preserves `query_projection` identity and changes it to
  single/nullable instead of converting it to a generic object.
- `BoundQueryProjectionNode` carries cardinality/nullability.
- `ResourceGraphResolver` now emits the closed semantic ADT rather than the
  legacy `types/contract` shape.
- Added `SemanticValueFactory.resourceName()`.

## Target dataflow

Laravel AST
  -> verified model/query target
  -> QueryProjection
  -> first()
  -> single + nullable QueryProjection
  -> ProjectionField
  -> scalar semantic type
  -> Bound AST
  -> RouteSync IR

No downstream stage parses SQL or guesses whether a projection field belongs to
its source model.

## Remaining migration boundary
`FieldNode.resolved` and several legacy framework-registry consumers still exist
outside the semantic-kernel boundary. They are the next migration target. They
must be converted to a separate `ResolvedExpression` carrier rather than adding
more optional semantic state to syntax AST nodes.

## Verification
Targeted TypeScript checking of the changed semantic modules produces no errors
for the changed modules. The supplied Phase 87.33 repository still has unrelated
pre-existing type errors in broader domain/barrel files; those are not hidden by
this phase.
