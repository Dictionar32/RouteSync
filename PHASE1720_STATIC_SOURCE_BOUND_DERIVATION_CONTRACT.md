# RouteSync Phase 1720 — Static Source-Bound Derivation Contract

Date: 2026-10-12

## Objective

Continue the interface-first migration for Laravel scanner invocation semantics. This phase strengthens the algebra-to-authority handoff so the authority cannot accidentally validate a candidate judgment against a separate, unrelated `SemanticKnowledgeDataFlow` value.

## Trace finding

Before this phase, `InvocationStaticSemanticAlgebraResult` carried the derived judgment, while `InvocationStaticSemanticAuthorityValidationInput` separately accepted both `knowledge` and `derivation`. The type therefore allowed a caller to pair a candidate derived from one knowledge snapshot with another knowledge snapshot at validation time. A contract string alone could describe the intended correlation, but the handoff shape did not carry that correlation as data.

## Interface changes

File: `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`

- The `derived` branch of `InvocationStaticSemanticAlgebraResult` now carries `sourceKnowledge: SemanticKnowledgeDataFlow` alongside the aggregate judgment.
- `InvocationStaticSemanticAuthorityValidationInput` now contains only the `derivation` envelope. It no longer accepts a separately supplied knowledge snapshot, subject, or judgment.
- `InvocationStaticSemanticAlgebraContract` advances to version 3 and declares `sourceSnapshotHandoff` and an updated `outputMeaning` law.
- `InvocationStaticSemanticAuthorityValidationContract` and its receipt advance to version 6 and explicitly state that authority reads the exact source knowledge snapshot carried by the derived envelope.
- `InvocationStaticSemanticJudgmentContract` advances to version 10; the judgment model and coverage contracts advance to version 16; the pipeline contract advances to version 29.
- Existing public type exports remain available through `packages/core/src/index.ts`.

## Laravel scanner boundary

`packages/core/src/types/upstream/laravelControllerScannerInterface.ts` remains a source-collection/delegation boundary. No production scanner wiring was changed. The scanner does not resolve targets, bind arguments, project effects, assemble proof, or validate authority.

No dependency on `core/src/semantic/foundation` was introduced.

## Verification

- Phase 1720 audit: **13/13 PASS**.
- Regression audits Phase 1702–1720: **284 checks PASS across 19 audit scripts**.
- Targeted strict TypeScript check: exits nonzero because of 88 lines of diagnostics in other existing domain/upstream modules; **zero diagnostics reference either changed interface file**.
- Full package build: not run.
- Static invocation algebra implementation: not implemented in this phase.
- Authority validator implementation: not implemented in this phase.
- Production Laravel scanner wiring: not changed.

Run the focused audit with:

```bash
npm run audit:phase1720-static-source-bound-derivation-contract
```

## References consulted

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- PHP-Parser AST Builders: https://github.com/nikic/PHP-Parser/blob/master/doc/component/AST_builders.markdown

These references support interface-based compiler analysis and preserving the AST distinction between ordinary method calls and static calls. They do not establish that RouteSync's static invocation implementation is complete.

## Next step

Implement the static algebra against the stage interfaces, carrying the same source-knowledge snapshot through derivation. Then implement authority validation against that envelope, with typed violations and no re-derivation or repair. Only after those implementations are verified should scanner wiring be changed.
