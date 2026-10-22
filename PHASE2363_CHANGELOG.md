# Phase 2363 — Resource registration preservation and runtime boundary audit

- Fixed a proven semantic data-loss defect: `RouteSpecialKind.resource` had hard-coded empty `only`/`except` filters and false values for `shallow`/`scoped`, plus hard-coded true `creatable`/`destroyable`, despite those values being present in `RouteDeclarationAst`.
- The projection now preserves the declaration's action filter and resource capability modifiers in the canonical registration ADT.
- Added `scripts/audits/audit-phase2363-resource-registration-preservation.cjs`.
- Explicitly did not claim runtime-executor completion: the active scanner still dispatches `LaravelRouteDeclarationMethodJudgment` in `emitDeclaration`, and `routeProducerRelations.ts` still depends on `semantic/relations` and subscanner contracts. Those require an upstream-owned complete route-emission judgment, not a file move or another wrapper interface.
