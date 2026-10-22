# Phase 1723 — Domain-Owned Invocation Stage Judgments

## Trace finding

Phase 1722 introduced `InvocationStaticSemanticStageJudgment<Judgment>`. Although the generic wrapper kept a context and result together, the type parameter did not itself express the semantic role or invariants of the wrapped value. The abstraction was weaker than the stage-specific domain model already present upstream.

## Interface-first correction

Replaced the generic stage wrapper with explicit contracts in `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`:

- `InvocationStaticPositionalEvidenceJudgment`
- `InvocationStaticTargetResolutionJudgment`
- `InvocationStaticArgumentBindingStageJudgment`
- `InvocationStaticEffectProjectionStageJudgment`
- `InvocationStaticSemanticJudgmentCandidate`

Each contract names its own domain result field and retains the source-bound context. Binding, effect projection, and judgment assembly now accept the exact domain-specific stage types they require. `InvocationStaticSemanticAlgebraResult` exposes `candidate`, rather than a generic-looking `result`, on the derived branch. Public exports were updated accordingly.

The algebra contract is v6, static authority validation/receipt is v9, the high-level invocation pipeline contract is v32, and the Laravel controller invocation boundary is v11. The contracts explicitly state that scanner runtime is source-artifact collection/delegation only.

## Invariant limits

Named TypeScript interfaces make stage roles explicit but do not prove runtime object identity between `context` values or evidence provenance. Those remain authority validation obligations. No static algebra implementation, authority implementation, or production scanner wiring is claimed by this phase.

## Validation

Run `npm run audit:phase1723-domain-owned-invocation-stage-judgments` from the repository root. The audit checks domain-specific stage typing, authority handoff, synchronized contract versions, public exports, and absence of `semantic/foundation` or `any` escape hatches.
