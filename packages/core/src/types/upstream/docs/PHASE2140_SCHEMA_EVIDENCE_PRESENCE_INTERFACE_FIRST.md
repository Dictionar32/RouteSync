# Phase 2140 — Schema evidence presence is not field cardinality

## Trace

`Laravel controller scanner` → `LaravelControllerActionSemanticJudgmentAuthorityInterface` → `ControllerActionSchemaSemanticJudgmentAuthorityInterface.judge` → `ControllerActionSchemaDerivation` → action schema projection.

The schema authority previously converted `requestEvidence` to a field array and selected the derivation by checking whether `formFields.length` was zero. That collapsed two different semantic states:

- `no_form_request_schema_evidence`: no FormRequest schema evidence was supplied;
- `form_request_schema_evidence` with `source.fields = []`: a FormRequest was identified, but its field inventory is empty.

An empty field collection is not evidence that the FormRequest itself is absent. The prior cardinality gate could erase the evidence origin and incorrectly publish `inline_validation_schema`.

## Change

- The authority now selects the schema derivation from the existing `ControllerActionSchemaRequestEvidence.kind` discriminant.
- A present FormRequest source always retains `form_request_schema` or `form_request_and_inline_validation_schema`, including when its field inventory is empty.
- Only `no_form_request_schema_evidence` selects `inline_validation_schema` directly.
- The existing schema merge still carries `inlineSchema.validationEntries`; no parallel schema authority or foundation/relation subscanner was added.
- The schema semantic contract version advances from 2 to 3 to make the changed evidence-presence rule explicit.

## Trace findings outside this fix

- Invocation semantics already have a closed outcome ADT and an upstream authority; `invocationSemanticRuntimeExecutor` delegates `execute` to `authority.analyze` and batch execution to the existing batch authority.
- The Laravel controller scanner calls `responseSemanticPipeline.judgeIntegratedResponse` with the exact `invocationJudgment`, then forwards the same judgment and the resulting `responseJudgment` to AST projection and the final artifact.
- The integrated response pipeline composes source correlation → response evidence production → per-item source binding → response executor. Empty response evidence has an explicit ADT outcome rather than being treated as a complete response.
- A major unresolved ownership gap remains: `legacyLaravelControllerExecutionDependencies.actionJudgment.judge` still calls `scanControllerAction(...)`. Thus the action semantic authority is not yet independent of the legacy scanner/action resolver. This phase does not claim that migration is complete.

## Verification

Run `node scripts/audits/audit-phase2140-schema-evidence-presence-interface-first.cjs` for the focused contract audit. No full build, full typecheck, or Vitest run is claimed.
