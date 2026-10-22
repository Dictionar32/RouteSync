# Phase 2264 — Connect the existing closed dataflow judgment to action publication

## Root issue

The upstream `ControllerDataflowSemanticJudgmentAuthorityInterface` already closes controller dataflow into `ControllerDataflowSemanticJudgment`, including correlated binding judgments, payload judgments, the exact invocation judgment, source-correlated knowledge projection, and integrated response composition. The semantic controller body already carries that closed judgment as `method.body.dataflow`.

The action publication path previously discarded the judgment object and published only `body.dataflow.semanticVariables` as `LaravelControllerActionSemanticKnowledge.dataflow`. This severed the existing judgment from the canonical action semantic value, despite the authority and closed ADT already existing.

## Changes

- Evolved the existing `LaravelControllerActionSemanticKnowledge` interface with `dataflowJudgment`, typed as the existing `ControllerDataflowSemanticJudgment` contract. No new authority or duplicate judgment was introduced.
- Evolved the existing `ControllerActionContract` projection to carry the exact `method.body.dataflow` judgment.
- Connected the existing action publication wiring so `semantic.dataflowJudgment` receives `contract.dataflowJudgment` unchanged. The compatibility `semantic.dataflow` flow is projected from that same judgment's `semanticVariables` field.
- Advanced the existing action semantic judgment contract version from 45 to 46 and updated its existing contract-shape discriminator.

## Production path

`ControllerMethodAst.body.dataflow` (already closed by `ControllerDataflowSemanticJudgmentAuthorityInterface`)
→ `resolveControllerActionContract` preserves the exact judgment
→ `createActionJudgmentAuthority` publishes it as `LaravelControllerActionSemanticKnowledge.dataflowJudgment`
→ `LaravelControllerActionExecutionInterface` receives the completed action judgment.

## Explicitly not claimed

This phase does not remove the remaining `resolveControllerActionContract` derivations, subscanner imports, or all `semantic/relations` transitive dependencies. It fixes the concrete severed connection: the existing dataflow judgment is no longer reduced to only its variable-flow projection at action publication. Build/typecheck was not run.
