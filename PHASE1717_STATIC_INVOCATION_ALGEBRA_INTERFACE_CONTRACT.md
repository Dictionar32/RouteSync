# RouteSync Phase 1717 — Static Invocation Algebra Interface Contract

## Scope

This phase is interface-first. It introduces the upstream contract for deriving a complete static-invocation candidate judgment and explicitly updates the Laravel controller scanner boundary to delegate semantic derivation upstream. It does **not** implement the algebra, the static authority validator, or production scanner wiring.

## Trace and findings

The existing model already had typed target-resolution, argument-binding, effect-projection, aggregate-judgment, proof-ledger, and authority-validation contracts. However, there was no explicit static invocation algebra interface joining the source-knowledge input to the complete candidate judgment output. The scanner boundary described semantic ownership in general but did not name the static-algebra delegation boundary.

This left the future implementation seam underspecified: implementers could accidentally place derivation logic inside scanner code or treat a derived judgment as if it were already authority-validated.

## Changes

### `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`

Added:
- `InvocationStaticSemanticAlgebraInput`, containing the complete `SemanticKnowledgeDataFlow` and exact `SemanticStaticInvocation` subject.
- `InvocationStaticSemanticAlgebraInterface`, exposing one `derive` operation that returns a complete candidate `InvocationStaticSemanticJudgment`.
- `InvocationStaticSemanticAlgebraContract`, defining subject identity, static-form preservation, derivation order, target resolution, argument binding, effect ownership, proof assembly, authority handoff, and scanner boundary.
- `INVOCATION_STATIC_SEMANTIC_ALGEBRA_CONTRACT`, attached to the aggregate judgment, judgment model, coverage contract, and top-level invocation pipeline contract.

The interface distinguishes derivation from validation: algebra emits a candidate judgment; authority validates it and must not re-derive or repair it. The contract states that only a judgment accepted by authority may be treated as authoritative downstream.

### `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`

Advanced `LaravelControllerInvocationSemanticBoundaryContract` to version 7 and added `staticAlgebraBoundary`. The scanner must collect source facts and delegate static invocation derivation to the upstream algebra interface; it must not implement or inline semantic derivation.

### Public exports and audits

- Exported the algebra contract and interface types through `packages/core/src/index.ts`.
- Added `scripts/audits/audit-phase1717-static-invocation-algebra-interface-contract.cjs` and the npm audit script.
- Updated regression assertions in Phase 1706–1716 to reflect the currently evolved contract versions. The updates preserve the original assertions while preventing stale version checks from falsely failing after legitimate contract evolution.

## Verification

- Phase 1702–1717 regression audits: **240/240 checks passed across 16 audit scripts**.
- New Phase 1717 audit: **10/10 passed**.
- Strict TypeScript check of the two changed interface modules: command exited with code 2 because unrelated existing domain/upstream modules emit diagnostics. **No diagnostics referenced `invocationSemanticPipelineInterface.ts` or `laravelControllerScannerInterface.ts`.**
- Full package build: not run.
- Static algebra implementation: not present yet.
- Static authority validator implementation: not present yet.
- Production scanner wiring: not changed.

## Next step

Implement the static invocation algebra against this interface, then implement the authority validator against the existing compatibility, rule-obligation, proof-ledger, and witness-shape contracts. Only after those pieces are implemented and verified should scanner wiring delegate to them. Do not add semantic fallback, classification, proof synthesis, or obligation reconciliation to scanner runtime.
