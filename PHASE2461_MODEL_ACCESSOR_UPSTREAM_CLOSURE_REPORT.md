# Phase2461 — Model Accessor Upstream Closure

## Root cause
`ModelAccessorComputation` represented rejected analysis with only a reason/source, forcing `modelAccessorCanonical.ts` to infer an `unsupported_expression` at projection time. That left a semantic decision downstream and used `semantic/relations` for a binary ADT projection.

## Change
- Evolved the existing upstream `ModelAccessorComputation` ADT so rejected judgments carry a complete `Expression` value.
- `memberAccessorsParser.ts` now constructs the `unsupported_expression` at the point where the missing return expression is known.
- Added `ModelAccessorExpressionProjectionInterface` in `types/upstream`.
- Replaced the relation-backed exported function with `export const modelAccessorExpressionProjection: ModelAccessorExpressionProjectionInterface`, whose only job is to package the completed expression and result as `ResolvedExpression`.
- Removed the old `subscanners/model/modelAccessorCanonical.ts` and wired `modelCanonical.ts` to the typed operation.

## Verification
The Phase2461 static audit checks upstream ADT completeness, interface implementation, no relation/foundation imports in the projection, no downstream reclassification, and removal of the old function module. Full typecheck/build/Vitest/CLI validation has not been run in this workspace because dependencies are not installed.

## Open debt
Other model helpers still import `semantic/relations`; this phase closes one vertical slice and does not claim complete model subscanner retirement or transitive foundation removal.
