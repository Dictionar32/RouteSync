# RouteSync Phase 2440 — Laravel Upstream Authority, No Parameterized Runtime Executor

## Root cause

Two runtime wrappers were asking for semantic inputs and forwarding them to upstream authorities:

- RequestType derivation's executor accepted a prepared operation whose only payload was a final `RequestTypeDerivationRuntimeExecutionResult`, then returned that payload.
- Laravel route scanning injected an effective-controller-policy runtime executor whose `execute(input)` merely delegated to the existing semantic authority's `judge(input)`.

Neither wrapper represented independent runtime work. The first wrapped a compiler-time semantic outcome; the second wrapped an upstream judgment operation. Their parameterized construction/execution boundaries obscured ownership without adding execution semantics.

## Changes

- Removed `RequestTypeDerivationPreparedOperation`; upstream preparation now returns the existing closed `RequestTypeDerivationRuntimeExecutionResult` directly.
- Removed `RequestTypeDerivationRuntimeExecutorInterface` and its factory. The authority-backed lowering consumes the upstream outcome directly; it no longer asks a runtime factory to accept an operation and return its result.
- Replaced `LaravelRouteScannerInterface.effectiveControllerActionPolicyExecutor` with the existing `EffectiveControllerActionPolicySemanticAuthorityInterface` dependency.
- Laravel route scanner wiring now invokes `effectiveControllerActionPolicyAuthority.judge(...)` directly. Removed the parameterized policy runtime executor interface and instance.
- Advanced the Laravel route scanner contract version from 31 to 32.
- Added `audit:phase2440-laravel-upstream-no-runtime-params` under `scripts/audits`.

## Boundary clarification

`LaravelRouteScannerInterface.scan(input)` still accepts source-scan input. That is the source-acquisition boundary, not a runtime executor. The semantic authority's `judge(input)` also accepts an input by design because it is the upstream operation that reasons about the evidence. This phase removes the redundant runtime wrappers; it does not pretend that source acquisition or semantic reasoning needs no input.

## Known blocker not claimed as solved

The active CLI manifest path still reaches `routeManifestTypeLowering.ts` and `requestTypeDerivationProjectionPipeline.derive(...)`. The authority-backed alternative still requires a production `RequestTypeDerivationSemanticPipelineInterface` whose reasoning, verification, decision, and authority composition is valid. This phase does not fabricate such a producer or silently switch the CLI to an unverified legacy result. Full CLI interface-first cutover remains blocked on that upstream proof-producing composition.

## Validation

Run `npm run audit:phase2440-laravel-upstream-no-runtime-params`.

This audit is structural. A full TypeScript typecheck, package build, unit tests, and CLI end-to-end checks were not run as part of this phase.
