# Phase 2251 — Action-Resolver Dataflow Cutover

## Concrete implementation changes

1. Added the parser-owned `controllerResourceReturnSourceEvidenceProjection` adapter implementing the already-declared `ControllerResourceReturnSourceEvidenceProjectionInterface<PhpAstValue, SourceRange>`.
2. Changed `resolveControllerActionContract(...)` to project returned-expression evidence through that adapter and to submit each typed candidate to the injected `ControllerResourceBindingAuthorityInterface`. Only resolved authority judgments become published resource products; each product retains the exact candidate source range.
3. Removed `createControllerDataflowContract` / `createControllerReturnSet` imports from `controllerActionContract.ts`.
4. Moved the action contract's dataflow result shape to `ControllerActionDataflowContract`; `controllerActionTypes.ts` no longer imports `ControllerDataflowContract` from the controller subscanner. The empty action descriptor now constructs the existing closed empty variable-flow shape directly.
5. Replaced direct `semantic/relations` helper usage in `controllerDataflowSemanticJudgmentAuthority.ts`, `controllerDataflowBindingPayloadCorrespondenceAuthority.ts`, `controllerDataflowVariableIdentityAuthority.ts`, and `controllerSemanticVariableFlowCompositionAuthority.ts` with closed ADT elimination and typed array projections. These authorities keep their existing ownership and contract versions; no parallel authority/algebra was introduced.
6. Corrected the existing route-handler interface so the invokable action name remains the typed `ActionName`, and corrected its builder to pass typed action/class names instead of primitive strings.
7. Advanced action semantic contract and production wiring together to version 43. Removed the completed resource-return projection obligation from the outstanding action derivation remainder. Kept the transitive relation-dependency obligation open and renamed its owner to the remaining knowledge/collection vocabulary dependencies.

## Verification

- Phase 2240–2250 structural audits were reconciled with the implementation cutover and pass.
- Phase 2251 cutover audit passes 13/13 checks.
- A focused TypeScript 5.8.3 check over the edited action-contract, projection-adapter, dataflow-authority, correspondence, identity, variable-flow, and route-handler files produced no diagnostics in those edited files after the route-handler correction. The broader dependency graph still reports unrelated existing TypeScript diagnostics, and this is not a full project typecheck or build.
- `npm run build`, full typecheck under the repository's configured TypeScript 7 toolchain, and runtime/Vitest suites were not run.

## Explicit remaining work

This phase cuts the `resolveControllerActionContract(...)` production resolver off the legacy dataflow projection, but does **not** claim the entire CLI scanner is subscanner-free or transitively free of `semantic/relations` / `semantic/foundation`.

- `controllerAstCanonical.ts` still imports `createControllerDataflowContract` for its separate legacy semantic projection path.
- `resourceDataflowAggregator.ts`, resource model resolution, and legacy controller subscanner exports still refer to the legacy resource-binding type/path.
- The canonical dataflow authority's direct imports were removed, but `semanticDataflowKnowledge.ts` and the upstream `collections.ts` vocabulary still directly depend on `semantic/relations`. The full transitive graph therefore remains open.
- Other action semantic derivation and return/body projection still use existing controller subscanner implementations. Their retirement requires a separate source-correlated upstream cutover and must preserve integrated-response identity, variable flow, resource provenance, and route publication.

The next implementation step is to migrate the `controllerAstCanonical` semantic projection consumer and resource-model aggregation to the existing upstream evidence/judgment contracts, then repeat the transitive CLI dependency trace before claiming subscanner retirement.
