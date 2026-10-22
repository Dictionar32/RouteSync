# Phase 2233 — Body Judgment Upstream Ownership Cutover

## Root cause

The existing `ControllerBodySemanticJudgmentAuthorityInterface` already defined the closed body judgment, but `resolveControllerActionContract()` invoked its implementation itself. That made the legacy action contract the owner of when body semantics were derived, even though the resulting judgment was later published as upstream semantic knowledge.

## Change

- The existing action resolver now requires a `ControllerBodySemanticJudgment<SourceFile>` as input and consumes that exact value.
- The existing action semantic authority composition obtains the body judgment before calling the compatibility action projection.
- `scanControllerAction()` carries the supplied judgment through to the resolver without deriving a second body judgment.
- The typed body derivation ownership remainder is now empty. The source-AST projection remainder remains separate and open.
- Action contract version is 30. Resource-binding domain publication remains explicitly open, so overall action coverage remains `action_semantic_knowledge_partial`.
- Integrated response remains owned by `LaravelControllerResponseSemanticPipelineInterface`; no parallel response descriptor was reintroduced.

## Trace

`LaravelControllerInvocationSemanticJudgment` → existing action semantic authority composition → `controllerBodySemanticJudgmentAuthority.judge()` → `scanControllerAction(method, ..., bodyJudgment, ...)` → `resolveControllerActionContract(..., { bodyJudgment, ... })` → canonical action judgment → forwarding executor.

The resolver no longer imports or invokes `controllerBodySemanticJudgmentAuthority`; it only consumes the already-produced judgment.

## Explicit remaining gap

This is not a claim that the Laravel controller path is free of subscanner modules. The body authority implementation is still located in `subscanners/controller/controllerAstCanonical.ts`, and the compatibility action path still uses `scanControllerAction()` / `resolveControllerActionContract()`. Resource-binding domain publication also remains adapter-owned. The next cutover must address ownership and direct upstream-to-CLI wiring, not merely move code or rename modules.

## Verification boundary

The phase audit checks source wiring and ownership declarations. It does not replace TypeScript type-checking, Vitest, or a full build.
