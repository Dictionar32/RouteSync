# Phase 1985 — Response Evidence Source-Binding Interface

## Scope

Interface/type declarations only. No controller scanner, subscanner, wiring implementation, authority implementation, executor implementation, or AST projection runtime was changed.

## Trace finding

The previous response authority input carried response evidence and declared that source binding must be validated, but the input contract did not carry a typed source-binding judgment. That made the provenance requirement descriptive rather than part of the authority's typed input.

## Contract change

`LaravelControllerResponseEvidenceSourceBindingJudgment<InvocationJudgment>` is now a closed ADT:

- `controller_response_evidence_source_binding_complete`: every evidence item carries a `same_source_file_identity` judgment.
- `controller_response_evidence_source_binding_rejected`: evidence carries `different_source_file_identity` judgments.

`LaravelControllerResponseSemanticJudgmentInput` now receives this binding judgment instead of a second, independent evidence array. The authority cannot receive one evidence list and a separate unrelated binding list through this interface shape. A rejected binding is represented in the response blocker ADT and is forbidden from yielding a complete response product by the contract.

The existing `LaravelSourceIdentitySemanticsInterface` remains the owner of source-file identity semantics. This change does not create a second identity authority or a `relation`/`foundation` subscanner.

## Existing flow

`invocation judgment -> response evidence source-binding judgment -> response semantic authority contract -> outcome-indexed response judgment -> controller artifact contract -> source AST projection judgment`.

This is still a contract-level flow. The current production scanner does not yet populate `responseJudgment`; runtime migration remains outstanding and was intentionally not performed in this interface-first phase.

## Legacy subscanner trace

The controller subscanner directory still contains twelve nonempty controller modules and legacy imports of `semantic/relations`. They are not deleted in this phase because production consumers have not yet been migrated to the canonical upstream contracts. No `semantic/foundation` path or replacement subscanner was added.

## Verification

Run `node scripts/audits/audit-phase1985-response-evidence-source-binding-interface.cjs` from the RouteSync root. The audit is structural only; it is not a TypeScript typecheck or build.
