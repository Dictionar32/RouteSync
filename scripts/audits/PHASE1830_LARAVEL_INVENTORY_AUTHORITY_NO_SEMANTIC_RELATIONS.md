# Phase 1830 — Laravel Inventory Authority: No Semantic Relations Dependency

## Contract-first change

The Laravel controller invocation inventory contract is version 4. Its dependency boundary explicitly forbids imports from `semantic/foundation`, `semantic/relation`, and `semantic/relations`. The authority contract remains in `types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts`; this phase does not introduce a duplicate authority interface.

## Authority implementation

`laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts` no longer imports semantic relation helpers. It executes the existing typed closure obligations using native array operations and `Object.is`, preserving typed rejection variants and the non-empty rejection ledger. The authority remains the implementation of `LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface`.

## Trace result

- `semantic/foundation`: no import in the inventory contract or its authority implementation.
- `semantic/relation` / `semantic/relations`: no import in the inventory contract or its authority implementation.
- Invocation semantic judgment remains correlated as `sourceFile` plus integrated `response`.
- Scanner boundary still accepts the authority-produced closure receipt.
- Production `laravelSourceAstPipeline.ts` still invokes legacy `ControllerScanner.scanCanonicalBundle()` and `ControllerScanner.extractResourceDataflow()`. Production migration and retirement of the old subscanner path are **not complete**.

## Static audit

- Phase 1828 regression audit: 21/21.
- Phase 1829 regression audit: 19/19.
- Phase 1830 dependency-boundary audit: 13/13.
- Phase 1827 inventory-interface audit: 21/21.
- `package.json` parses successfully.

No build, typecheck, or E2E command was run. Static audits do not prove runtime correctness or full production migration.
