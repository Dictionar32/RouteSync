# Phase 1722 — Static Stage Judgment Envelope

## Trace finding

Phase 1721 made each stage input consume `InvocationStaticResolvedSourceContext`, but stage outputs still returned bare judgments. A later stage could therefore receive a target/binding/effect judgment detached from the context that produced it. The interface documented context continuity without representing that continuity in output types.

## Interface-first correction

- Added generic `InvocationStaticSemanticStageJudgment<Judgment>` carrying the source-bound context and the stage's domain judgment together.
- Positional evidence and target resolution now return context-bound envelopes.
- Argument binding consumes the context-bound target and positional-evidence envelopes and returns a context-bound binding envelope.
- Effect projection consumes the context-bound target envelope and returns a context-bound effect envelope.
- Judgment assembly consumes the context-bound target, binding, and effect envelopes and returns a context-bound final judgment.
- The final algebra result carries the final envelope; authority accepts only that derived result, not independently supplied context or judgment fields.
- Updated the static algebra, authority-validation, pipeline, and Laravel scanner boundary contracts and public export.

## Invariants and limits

The type shape prevents downstream stages from accepting a bare subjudgment through these interfaces. It does not, by itself, prove that every envelope contains the same object instance or valid source provenance. The authority must validate context identity, subject identity, source evidence, rule applicability, and obligation/proof correspondence. This phase changes interfaces/contracts only; no static algebra implementation, static authority implementation, or production scanner wiring is claimed.

## Verification

- Phase 1722 direct audit checks the stage envelope shapes, handoff types, contract versions, and public export.
- Targeted strict TypeScript check reports existing diagnostics in unrelated domain/resource-model modules; neither changed interface file is named in the diagnostics.
- Full package build was not run.


## Audit results

- Phase 1722 direct audit: **16/16 PASS**.
- Phase 1721 source-bound regression audit: **17/17 PASS**.
- Regression range Phase 1702–1722: **282/282 checks PASS across 21 audit scripts** (`PHASE1722_REGRESSION_AUDIT.json`).
- Targeted strict TypeScript check remains blocked by existing diagnostics in unrelated domain/resource-model modules; no diagnostics refer to the two changed interface files.
- Full package build was not run, by design.
