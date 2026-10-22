# RouteSync Phase 2394 — Route Producer-Input Operation Contract

## Scope

This phase evolves the existing `LaravelRouteScannerInterface` and canonical route vocabulary to make producer-input composition an explicit injected operation. It does not claim to complete the full route/manifest/CLI semantic chain.

## Audit and trace

The active route path previously invoked `routeProducerInputFromRouteBoundary(...)` directly inside scanner wiring. That function composes `RouteProducerInput` from a `RouteBoundaryContract`, `RouteDeclarationEvidence`, `SourceSpan`, and `LaravelRouteDeclarationMethodJudgment`, but the composition operation itself was not part of the scanner's upstream contract. This made the operation's existence visible only as an imported helper rather than as an operation dependency declared and injected by `LaravelRouteScannerInterface`.

## Changes

1. Added the existing upstream route vocabulary contracts `RouteProducerInputCompositionInput` and `RouteProducerInputComposition` in `types/upstream/route.ts`. The input is closed over the existing boundary, evidence, source-span, and method-judgment contracts.
2. Added `routeProducerInputComposition` to `LaravelRouteScannerInterface` and incremented its contract version from 28 to 29.
3. Added an operation adapter, `routeProducerInputComposition`, that accepts the closed input contract and delegates to the existing producer-input projection using the current path's existing no-controller-map behavior.
4. Changed scanner wiring to execute the injected `routeProducerInputCompositionOperation.compose(...)`, then pass its complete `RouteProducerInput` to the injected `RouteProducer.produce(...)` operation. The scanner no longer calls the projection function directly.
5. Updated route-flow audit expectations to verify the new operation boundary instead of asserting the old direct helper call. Added `audit-phase2394-route-producer-input-operation-contract.cjs`.

## Contract flow now demonstrated

`RouteDeclarationAst → RouteDeclarationEvidence → existing semantic judgments → RouteBoundaryContract → injected RouteProducerInputComposition.compose → RouteProducerInput → injected RouteProducer.produce → RouteAst`

This proves explicit contract ownership and runtime wiring for the producer-input composition step. It does **not** prove that all semantic interpretation has moved upstream or that the whole chain is interface-first.

## Validation evidence

- Phase 2394 structural audit: **10/10 assertions passed**.
- Existing phase 2380–2393 route/manifest/CLI structural audits were rerun after updating expectations for the explicit operation contract; no failures were reported in that run.
- TypeScript parser syntax checks: **4/4 changed TypeScript files passed**.
- `tsc --noEmit --pretty false` remains blocked before a meaningful project typecheck by pre-existing parse errors in `effectiveControllerActionPolicyResolver.phase921.test.ts` at lines 47 and 221 and by the installed global TypeScript compiler rejecting the repository's `ES2025` target/lib settings. No package build, Vitest run, or end-to-end CLI scan/sync was run.

## Remaining gaps — not closed by this phase

- The operation implementation and boundary projection are still imported from `compiler/scanner/subscanners/routeProducerRelations.ts`; this phase does not retire that module or move its semantic ownership to a proper upstream implementation owner.
- The route path still depends on `semantic/relations` in the producer-input composition implementation, and scanner wiring still uses `semantic/relations` and the `subscanners/route-scanner` emitters. No claim is made that these dependencies have been eliminated.
- The producer-input composition still contains method-judgment dispatch and request/response/security/domain projection logic. Making the operation injectable does not itself prove those decisions are represented by a sufficiently complete upstream judgment/ADT.
- Invocation Semantic Judgment → Operation Contract → Integrated Response → Runtime Executor → Manifest → CLI has not been revalidated end-to-end in this phase.

## Completion status

**Partial contract-closure step.** The operation is explicit in the existing upstream scanner interface and the scanner executes the injected operation instance. The full interface-first semantic closure remains open until the operation implementation's authority, relation dependencies, downstream invocation/response/runtime chain, and actual CLI regression are verified and corrected.
