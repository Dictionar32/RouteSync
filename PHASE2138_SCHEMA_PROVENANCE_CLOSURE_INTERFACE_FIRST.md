# Phase 2138 — Schema Provenance Closure (Interface First)

## Trace finding

`RouteValidationRuleEntry` already retains the exact source span, but `RouteSemanticFlowValidationRuleSet` groups entries into `RequestField` values that carry one `source` span. Grouping multiple inline rules into a shared root/field can therefore collapse the many-to-one source relationship in the projected field. The original entry collection existed on the body judgment, but it was not part of `RouteSchemaPayload`, so the final schema projection could not carry the complete inline evidence with it.

## Change

- `RouteSchemaPayload` now publishes a frozen `validationEntries` collection alongside canonical fields, messages, and attributes.
- `createRouteSchemaPayload` accepts the source-bound entries as a fourth parameter; existing call sites retain compatibility through the empty default.
- The controller body semantic judgment authority attaches original validation entries to the schema it creates.
- The action schema authority preserves those entries when publishing the merged FormRequest + inline schema.
- The body authority interface is versioned to contract 4 and declares the downstream provenance-closure invariant.
- No parallel authority or foundation/relation layer was added.

## Boundary

This preserves complete inline-validation evidence alongside the schema; it does not claim that every individual `RequestField.source` has become multi-source, nor that the legacy controller action resolver has been retired. Those remain explicit follow-up work.

## Verification

Run `npm run audit:phase2138-schema-provenance-closure-interface-first`. Full build/typecheck/Vitest are intentionally not part of this phase's verification.
