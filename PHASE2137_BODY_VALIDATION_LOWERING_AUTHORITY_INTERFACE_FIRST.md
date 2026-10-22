# Phase 2137 — Body Validation Lowering Authority (Interface First)

## Trace finding

The prior flow extracted source-bound `RouteValidationRuleEntry` values in `controllerBodyResolver.ts`, but immediately lowered those entries to `RequestField[]` and `RouteSchemaPayload` there. `controllerBodySemanticJudgmentAuthority` then merely forwarded the prebuilt schema. That meant the body semantic judgment interface did not actually own closure of the validation evidence into the canonical schema.

## Change

- `controllerBodyResolver.ts` now extracts and publishes canonical validation entries with per-entry `SourceSpan`; it no longer constructs `RequestField[]` or `RouteSchemaPayload`.
- The existing `controllerBodySemanticJudgmentAuthority` now performs the lowering through the existing `RouteSemanticFlowValidationRuleSet` and publishes the resulting canonical `RouteSchemaPayload`.
- `ControllerBodySemanticJudgmentAuthorityInterface` advances to contract version 3 and states the new closure invariant.
- The existing action-schema judgment remains the sole owner of FormRequest/inline schema merge. The original entries continue through that judgment for provenance.
- No new foundation layer or parallel validation authority was introduced.

## Verification scope

The Phase 2137 audit checks evidence extraction, source provenance, authority-owned lowering, downstream schema judgment wiring, and runtime executor separation. Syntax-only transpilation is used for changed TypeScript files. Full build/typecheck/Vitest are intentionally not run in this environment.
