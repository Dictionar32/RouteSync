# RouteSync Phase 1832 — Laravel Typed Identity Relation Judgments

## Interface-first trace

- `packages/core/src/types/upstream/sourceProjectIdentity.ts` previously exposed identity equality as `boolean` predicates.
- `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts` consumes the canonical identity semantics interface.
- `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts` uses project/file identity equality to enforce project binding, duplicate-source detection, one-to-one judgment correspondence, and orphan rejection.
- `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts` continues to correlate `sourceFile` with the integrated invocation response in one judgment.
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts` consumes a closure receipt.
- Production `laravelSourceAstPipeline.ts` still calls legacy `ControllerScanner` methods. Production migration and subscanner retirement are not complete.

## Contract changes

- Replaced `sameSourceProject(...): boolean` with `relateSourceProjects(...) => SourceProjectIdentityRelationJudgment`.
- Replaced `sameSourceFile(...): boolean` with `relateSourceFiles(...) => SourceFileIdentityRelationJudgment`.
- Both relation results are closed discriminated unions with same/different variants and typed identity evidence.
- Identity semantics contract version: 2.
- Inventory contract and validated/rejected result version: 6.
- Inventory authority consumes the relation judgment discriminants rather than primitive boolean results.
- No direct `semantic/foundation`, `semantic/relation`, or `semantic/relations` imports were added to the identity semantics module or inventory authority.

## Static verification

- Phase 1832 audit: 13/13.
- Phase 1831 identity audit: 16/16.
- Phase 1830 no-semantic-relations audit: 13/13.
- `package.json` JSON parse: passed.
- Build, typecheck, and E2E were not run.

## Boundary statement

The public identity contract no longer returns `boolean`; its runtime implementation still compares canonical value components to construct the typed relation judgment. This does not claim that all runtime comparison work has disappeared. The production Laravel scanner is still on the legacy wiring path and must be migrated in a later phase before subscanner retirement.
