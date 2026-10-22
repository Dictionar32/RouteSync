# Phase2371 — Existing Declaration Evidence Contract Ownership

## Intent

Continue the required audit → trace → authority → root-cause → contract-sufficiency sequence by removing the parallel resource-only evidence shape. The existing `RouteDeclarationEvidence` is already the upstream declaration evidence contract consumed by `RouteProducerInput`; resource authority now consumes that same contract rather than a second resource-specific projection contract.

## Contract evolution

- `RouteResourceDeclarationInput.declaration` now uses `RouteDeclarationEvidence` from `packages/core/src/types/upstream/routeDeclarationEvidence.ts`.
- Removed `RouteResourceDeclarationEvidence` from `routeResourceFlow.ts` and from the public export surface.
- `resolveRouteResourceDeclarationJudgment` now reads path, prefix, and resource modifiers from the canonical declaration evidence and remains the owner of resource identity and registration formation.
- The active scanner reuses the existing `routeDeclarationEvidenceFromAst` projection already used at the producer boundary, avoiding a second resource-only evidence projection.
- Updated the Phase2370 audit to assert canonical evidence reuse and added a focused Phase2371 audit.

## Evidence and limits

This phase improves contract ownership for resource declaration evidence. It does **not** complete the whole scanner contract: scanner still invokes `routeDeclarationFlow`, constructs controller/action targets, imports `semantic/relations`, and depends on `subscanners` for route emission and standard-route path resolution. `RouteEmission` → `RouteBoundaryContract` → `RouteProducer` and CLI output still require further trace and integration.

No `npm run build` was run. Type-check and CLI end-to-end must be rerun/verified separately; static audits do not prove semantic correctness.
