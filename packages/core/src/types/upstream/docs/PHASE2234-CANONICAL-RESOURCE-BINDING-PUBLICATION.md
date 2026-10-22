# Phase 2234 — Canonical Resource-Binding Publication

## Root cause

The existing `ControllerResourceBindingAuthorityInterface` already owned the semantic judgment that correlates resource identity, model origin, and declared response identity. However, `LaravelControllerActionSemanticJudgmentAuthorityInterface` reconstructed the published `ControllerResourceBinding` ADT inline. The semantic result had one owner while the canonical domain publication had another.

## Change

- Evolved the existing `ControllerResourceBindingAuthorityInterface` with `publishResolved` and raised its contract version from 6 to 7.
- `publishResolved` accepts only already-resolved domain facts plus exact `SourceSpan`; it does not reclassify evidence or create another judgment.
- The action judgment wiring delegates canonical `ControllerResourceBinding` construction to the existing resource-binding authority.
- Closed the `resource_binding_domain_publication` remainder in `LaravelControllerActionSemanticKnowledgeCoverage`.
- Raised `LaravelControllerActionSemanticJudgmentContract` from 30 to 31.
- Kept action coverage partial because body source-AST projection is still an open compatibility boundary.

## Authority chain

`source evidence -> ControllerResourceBindingAuthorityInterface.judge -> resolved resource facts -> ControllerResourceBindingAuthorityInterface.publishResolved -> canonical ControllerResourceBinding -> action judgment -> scanner artifact`

Integrated response remains owned by `LaravelControllerResponseSemanticPipelineInterface`. Runtime execution still forwards the action judgment and does not perform semantic reclassification.

## Remaining migration debt

This phase does not claim that the Laravel controller path is free of subscanner dependencies. `scanControllerAction`, `resolveControllerActionContract`, and source-AST projection remain in the compatibility path. The next root-cause change must move those remaining responsibilities to existing upstream contracts and wire the CLI path directly; file relocation alone is not closure.

## Validation boundary

The phase audit checks contract ownership and wiring structurally. It does not replace TypeScript type-checking, Vitest, or the project build.
