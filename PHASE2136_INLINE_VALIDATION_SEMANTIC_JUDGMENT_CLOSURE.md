# Phase 2136 — Inline Validation Semantic Judgment Closure

## Trace finding

Phase 2135 corrected inline validation source spans at the parser/body-resolver boundary, but the completed body and schema judgments only published `RouteSchemaPayload`. The canonical `RouteValidationRuleEntry` values (including per-entry `SourceSpan`) were dropped from the judgment boundary after lowering.

## Change

- `ControllerBodyResolution` now publishes canonical `validationEntries` in addition to the schema projection.
- `ControllerBodySemanticJudgment` retains those entries as upstream validation knowledge; its contract version advances to 2.
- `ControllerActionSchemaSemanticJudgmentAuthorityInterface` receives and preserves the canonical entries in its completed judgment.
- The action contract supplies `bodyJudgment.validationEntries` to the schema authority; the schema judgment contract version advances to 2.
- The schema authority remains the single owner of FormRequest/inline-schema merge policy.

## Boundaries preserved

Invocation judgment correlation, controller-wide integrated response, and runtime executor pass-through are unchanged. No `foundation` layer or duplicate validation authority was added.

## Remaining debt

The inline validation semantic facts are now retained across the body/schema judgment boundary, but extraction and lowering still begin in the controller body resolver. Full legacy action resolver retirement and full project typecheck/build remain unverified.
