# Phase 2495 — Resource Output-Shape Authority

## Implemented

- Extended the existing `ResourceFieldSemanticJudgment` with the closed `ResourceFieldOutputShapeJudgment` ADT: scalar/expression, nested object, single resource, and resource collection. No duplicate authority interface was introduced.
- Moved classification of `resource_single`, `resource_collection`, `nested_array`, and scalar/expression into the existing upstream-owned `resourceFieldSemanticAuthority`.
- Updated `resourceFieldProducer` to project the returned shape judgment. It no longer imports `semantic/relations` or independently classifies the source value's output shape.
- Added explicit invariant failures if the closed judgment and source evidence disagree; no silent scalar fallback is used for a mismatched nested-object judgment.

## Remaining work

- The resource field producer still resides under `scanner/subscanners/resource`; canonical scanner wiring and the remaining resource producer dependency on `subscanners` have not been migrated in this phase.
- `resourceProducer.ts`, `resourceAstExpressionMapper.ts`, `resourceBinder.ts`, and `resourceSourceEvidence.ts` still require separate trace/evolution to remove their `semantic/relations` dependencies where semantically appropriate.
- No full build, Vitest suite, or end-to-end CLI run is claimed.
