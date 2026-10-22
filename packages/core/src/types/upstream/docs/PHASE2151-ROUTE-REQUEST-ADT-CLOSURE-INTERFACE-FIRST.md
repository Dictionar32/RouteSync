# Phase 2151 — Route Request ADT Closure, Interface First

## Trace result

The canonical controller request authority can publish `no_request`, `form_request`, `framework_request`, `typed`, and `typed_unresolved`. The route domain previously had only `form_request`, `framework_request`, and `no_request`; the endpoint projection had `form_request`, `framework_request`, `inline_input`, and `no_input`.

That domain mismatch made it impossible for a route boundary to preserve a typed request judgment or a failed type-resolution judgment even if the canonical action judgment supplied one.

## Changes

- Extended the existing `RouteRequestBinding` ADT with `typed_request` carrying `TypeExpression` and `unresolved_request` carrying the original `UnresolvedPhpParameterTypeJudgment`.
- Extended the existing `EndpointRequestBinding` ADT with `unresolved_input`, preserving the same unresolved judgment instead of flattening it into `no_input`.
- Updated the existing route-boundary-to-endpoint projection to preserve `typed_request` as `inline_input` and `unresolved_request` as `unresolved_input`.
- Updated the existing high-level source-model relation table for the new endpoint variant.
- Updated request-type aggregation to skip non-FormRequest variants explicitly, including unresolved outcomes, instead of treating every non-`no_request` variant as if it carried FormRequest identity.
- No new `relation/foundation`, subscanner, or duplicate authority was introduced.

## Still open

The production route-boundary constructor still reads `ControllerActionInfo.request`, the legacy action projection. It does not yet receive `LaravelControllerActionSemanticJudgmentInterface.semantic.request`. Therefore this phase closes the ADT/projection capacity and avoids unsafe solver casts, but it does **not** claim that canonical `typed` / `typed_unresolved` outcomes are already flowing from the upstream authority into every route boundary.

Next work must wire the existing canonical action judgment to the existing route boundary, while keeping schema compatibility on its legacy contract until that consumer is migrated. Do not infer a type at route production time.

## Verification limits

Structural audit and syntax-only TypeScript transpilation are used. Full build, full typecheck, and Vitest are not run.
