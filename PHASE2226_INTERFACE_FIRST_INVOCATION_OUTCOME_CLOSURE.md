# Phase 2226 — Interface-First Invocation Outcome Closure

## Boundary

This phase intentionally changes the existing upstream interface contract first. It does not add runtime wiring, a `relation`/`foundation` layer, or another subscanner. The Phase 2225 runtime-wiring experiment is not included in this checkpoint because it advanced wiring before closing the upstream contract.

## Trace

1. `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts` owns the closed invocation judgment ADT and the `LaravelControllerInvocationSemanticJudgmentAuthorityInterface` contract.
2. `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts` composes the existing source-binding and invocation-integration authorities. It does not own Laravel HTTP response meaning.
3. `packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts` owns `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse`, indexed by the exact invocation judgment subtype. Its result preserves complete response judgments and explicit source-binding/source-correlation rejection judgments.
4. `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` passes the same `invocationJudgment` into integrated response judgment and AST projection, then stores both on the same controller artifact.
5. `packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts` and `packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts` still retain the legacy action/response descriptor derivation path. This phase does not claim that path has been migrated.

## Interface correction

The old invocation authority signature allowed `controller_invocation_pipeline_not_provided` to appear to return any invocation outcome. That contradicted the runtime contract: absence of a pipeline is specifically `not_connected`.

The existing authority interface now overloads `judge` by input variant:

- `controller_invocation_pipeline_not_provided` → `LaravelControllerInvocationNotConnectedJudgment` only.
- `controller_invocation_pipeline_provided` → `LaravelControllerInvocationProvidedPipelineJudgment`, which excludes `not_connected` while retaining source-binding rejection, complete, and blocked outcomes.
- The union-input overload remains for callers holding an unresolved input ADT.

The existing contract version is advanced to 14 and explicitly states the input/outcome rule. The authority implementation exposes matching overloads; the semantic execution path and dependencies remain unchanged.

## Ownership distinction

`LaravelControllerInvocationSemanticJudgmentInterface.response` is the PHP invocation-pipeline integration outcome (`not_connected`, source-binding rejected, complete, or blocked). It is not the Laravel HTTP response judgment. Laravel HTTP response meaning remains owned by the existing `LaravelControllerResponseSemanticPipelineInterface` and is correlated to the exact invocation judgment.

## Verification boundary

The structural audit checks the interface signatures, outcome exclusion, contract version, unchanged integrated-response owner, and absence of new `relation`/`foundation` imports or subscanner additions. ZIP integrity is checked. TypeScript build, typecheck, and Vitest are intentionally not run in this environment; this archive must not be described as build-verified.
