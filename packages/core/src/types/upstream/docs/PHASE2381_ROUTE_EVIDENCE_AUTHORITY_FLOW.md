# Phase 2381 — Route Evidence Authority Flow

## Scope

This phase repairs one active end-to-end datum inconsistency in the Laravel route scanner: the scanner previously constructed canonical `RouteDeclarationEvidence` for emission but independently derived `RouteDeclarationFlow` from the compiler AST for target, action, group-prefix, and middleware projection. The method authority also received the AST's method fields rather than the already-created canonical evidence.

## Code changes

- `laravelRouteScanner.ts` no longer imports or derives `RouteDeclarationFlow`.
- The scan loop creates one `RouteDeclarationEvidence` value per parsed declaration.
- `LaravelRouteDeclarationMethodJudgmentAuthority.judge` consumes `evidence.method` and `evidence.targetMethods`.
- Added the closed upstream `LaravelRouteDeclarationOperationAuthority` ADT with resource and standard/query variants. It composes the existing resource-flow, path-resolution, and authorization authorities.
- `LaravelRouteScannerInterface` now injects this composed operation authority instead of exposing three duplicate narrow-authority slots.
- Moved the existing method-judgment vocabulary/ADT to `laravelRouteDeclarationMethodJudgment.ts` and re-exported it through `laravelRouteScannerInterface.ts`, removing the new operation contract's type dependency cycle through the orchestration interface.
- The same evidence instance is passed into the operation judgment and then into the runtime projection executor.
- Controller/action projection reads the target ADT and source provenance in evidence.
- Authorization middleware projection reads `evidence.middleware` and `evidence.routeMiddleware`.
- Path resolution reads `evidence.path` and `evidence.prefix` inside the upstream operation authority.
- Closure return projection continues to consume the existing `ControllerReturnSemantic` ADT carried by the closure evidence.
- Added `audit:phase2381-route-evidence-authority-flow` package script and a focused structural audit.

## End-to-end datum trace

`RouteDeclarationAst → routeDeclarationEvidenceFromAst (one canonical evidence value) → method authority judgment → LaravelRouteDeclarationOperationAuthority (resource/path/authorization judgment ADT) → route-emission executor → RouteEmission → RouteBoundaryContract → RouteProducerInput → RouteAst → scan artifact → CLI manifest path`

The evidence and judgment now share one source datum. The trace still includes the AST later for source-span provenance and producer boundary construction; this phase does not claim that all AST references have been eliminated from compiler wiring.

## Audit results

- Phase 2381 evidence-authority-flow audit: PASS 12/12.
- Phase 2380 closure-return contract audit: PASS 8/8.
- Phase 2379 evidence-closure audit: PASS 8/8.
- Phase 2370: PASS 11/11.
- Phase 2371: PASS 10/10 after updating two stale audit patterns to match the evidence projection's explicit source-file argument.
- Phase 2372: remains intentionally NOT COMPLETE (`pass: false`); the audit has been updated to reflect the new operation ADT and correctly identifies the remaining typed-target and post-emission boundary gaps.
- Phase 2374: PASS 8/8.
- Phase 2375: PASS 15/15.

## Remaining blockers (not claimed closed)

1. The operation judgment still carries source target evidence; controller/action target projection and the unresolved response descriptor are still constructed in the scanner executor.
2. The active scanner still imports `semantic/relations` and compiler subscanner emitter functions.
3. `RouteBoundaryContract` and `RouteProducerInput` are still assembled after `RouteEmission` rather than being produced from the complete upstream declaration judgment.
4. `routeDeclarationEvidenceFromAst` is still implemented in a compiler subscanner module and its closure return producer depends on `controllerAstCanonical`; ownership migration to the proper upstream semantic owner remains open.
5. TypeScript checking is blocked by the environment's compiler version not accepting the repository's `es2025` target/lib, plus two pre-existing syntax errors in `effectiveControllerActionPolicyResolver.phase921.test.ts` (lines 47 and 221). No full typecheck, package build, or end-to-end CLI regression was achieved. `npm run build` was intentionally not run.

## Closure decision

Phase 2381 closes the duplicated AST/dataflow derivation and introduces an upstream closed operation judgment ADT that owns resource/path/authorization resolution. It does **not** close the overall interface-first route declaration chain. The next implementation must evolve the existing upstream authority contracts to produce a complete closed declaration judgment, then make the scanner an executor of that judgment and verify the actual CLI output.

## Final execution summary

| Audit | Result | Interpretation |
|---|---:|---|
| Phase 2370 resource authority wiring | PASS 14/14 | Existing resource authority is composed through the new operation authority. |
| Phase 2371 declaration evidence | PASS 10/10 | The canonical evidence contract remains shared. |
| Phase 2372 active route declaration authority | NOT COMPLETE | Intentionally non-passing because typed target projection and pre-emission boundary closure remain open. |
| Phase 2374 path authority wiring | PASS 8/8 | Path authority is now consumed inside the composed operation authority. |
| Phase 2375 invocation/operation/response/CLI | PASS 15/15 | Existing controller invocation pipeline checks remain passing; this does not prove route declaration end-to-end closure. |
| Phase 2379 evidence closure | PASS 8/8 | Updated to assert operation ADT dispatch and current ownership. |
| Phase 2380 closure return contract | PASS 8/8 | Closure return evidence remains consumed by the shared standard/query executor. |
| Phase 2381 evidence/operation authority flow | PASS 16/16 | Evidence reuse, composed authority wiring, and closed operation ADT checks pass. |

The repository-wide `tsc --noEmit` attempt could not validate the patch: the globally available compiler rejects the repository's `ES2025` target/lib, and reports two existing parse errors in `packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.phase921.test.ts` at lines 47 and 221. After correcting the Phase 2381 scanner syntax error discovered by that check, no parse error was reported for the changed scanner or new authority file. This is not a successful typecheck. No package build or end-to-end CLI run was performed.
