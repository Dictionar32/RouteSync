# Phase 1872 — Laravel Invocation Source Identity Judgment (Interface First)

## Trace

`SourceFile` → `LaravelSourceIdentitySemanticsInterface.relateSourceFiles` → `SourceFileIdentityRelationJudgment` → `PhpSourceInvocationSemanticSourceBindingJudgment` → `PhpSourceInvocationSemanticPipelineIntegrationResult` → `LaravelControllerInvocationSemanticJudgmentInterface.response` → `LaravelResourceIntegratedResponse`.

The Phase 1871 source-binding authority still compared raw `StringValue` payloads using `relationEqual` and `relationGate`, even though `sourceProjectIdentity.ts` already owned a typed same/different source-file identity judgment. That duplicated identity semantics and left the binding judgment without a first-class typed record of the relation that authorized or rejected publication.

## Changes

- Source-binding closed and rejected variants now retain the exact corresponding `SourceFileIdentityRelationJudgment` variant.
- `PhpSourceInvocationSemanticSourceBindingAuthorityInterface` explicitly exposes its `LaravelSourceIdentitySemanticsInterface` dependency.
- The source-binding authority delegates source identity to `laravelSourceIdentitySemantics.relateSourceFiles`; it no longer imports `semantic/relations` helpers for identity classification.
- Integration and controller contract versions were advanced and now declare that the typed source identity judgment is preserved.
- The resource invocation integration model now explicitly requires that each binding judgment retain its typed source identity relation.
- Historical Phase 1870/1871 audit assertions were updated to the current contract versions so their evidence-preservation checks remain usable.

## Scope boundaries

No scanner runtime, scanner wiring, or subscanner files were changed. This phase does not claim subscanner retirement or `semantic/relations` removal; the resource semantic authority and scanner wiring still have separate relation-helper consumers to migrate after the upstream contracts are closed.

## Verification

Run the Phase 1872 audit plus the Phase 1871 and Phase 1870 regression audits. Also run `node --check` for all three audit scripts and parse `package.json`. Full build and TypeScript compilation are intentionally not run in this environment.
