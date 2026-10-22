# Phase 2151 Changelog

- Extended the existing `RouteRequestBinding` ADT with `typed_request` and `unresolved_request` variants.
- Extended `EndpointRequestBinding` with `unresolved_input`, retaining the original failed PHP type judgment.
- Updated the existing route boundary projection and high-level source-model relation table for the new variants.
- Hardened request-type aggregation so only supported FormRequest bindings enter FormRequest-specific aggregation; framework, typed, unresolved, and absent request variants are not cast into FormRequest shapes.
- Updated Phase 2149/2150 carry-forward audits to check the current contract without pretending the remaining action-judgment-to-route-boundary wiring is closed.
- Added Phase 2151 trace, structural audit, and interface-first documentation.

## Explicitly open

The route boundary still reads the legacy `ControllerActionInfo.request`; the canonical upstream action judgment's `semantic.request` has not yet been wired into route construction. No full build, full typecheck, or Vitest was run.
