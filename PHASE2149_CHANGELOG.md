# Phase 2149 Changelog

- Advanced `LaravelControllerActionSemanticJudgmentContract` from v17 to v18.
- Added typed ownership obligation `typed_request_binding_projection_loss` to the existing action judgment coverage contract.
- Explicitly recorded the route producer's current lossy fallback from non-FormRequest/non-framework request outcomes to `no_request`.
- Added a source trace and targeted static/syntax audit.
- Updated Phase 2147/2148 carry-forward audit expectations to the current v18 contract.
- No new relation/foundation layer or subscanner was added.
- No full build, full typecheck, or Vitest run was performed.
- Important: downstream route request ADT and runtime behavior are not yet fixed; the new obligation intentionally keeps this debt visible.
