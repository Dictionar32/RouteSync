# Phase 2134 — Action Schema Semantic Judgment

## Trace finding

`resolveActionSchema(request, inlineSchema)` combined FormRequest fields with inline validation fields inside `actionValidationExtractor.ts`, while `resolveControllerActionContract` published only the final `RouteSchemaPayload`. The schema's derivation origin was lost at the semantic boundary.

## Change

- Added `ControllerActionSchemaSemanticJudgmentAuthorityInterface` in upstream types.
- Added a closed derivation ADT distinguishing inline-only, FormRequest-only, and combined schema outcomes.
- The existing schema merge rule now belongs to the upstream implementation `types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts` and emits a source-correlated judgment.
- `ControllerActionContract` projects the existing request ADT into schema-relevant evidence, retains the exact judgment, and takes its canonical schema from that judgment.
- Action semantic publication reads `schemaSemanticJudgment.schema`; it does not re-run the merge.
- Action semantic contract advanced to version 10.
- Invocation judgment, controller-wide integrated response pipeline, body judgment, and runtime pass-through remain separate.

## Remaining debt

This phase closes the schema merge/provenance boundary, not the entire Laravel action semantic derivation. `scanControllerAction()` and `resolveControllerActionContract()` remain production dependencies. Body AST projection, request-binding compatibility, and resource-binding aggregation still need separate trace-driven migrations.

## Validation scope

The Phase 2134 audit checks contract ownership, source correlation, schema provenance, wiring, public exports, and preserved pipeline boundaries. It does not replace a full TypeScript build, typecheck, or Vitest run.
