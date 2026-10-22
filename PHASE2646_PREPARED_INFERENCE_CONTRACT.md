# Phase 2646 — Prepared Inference Contract

## Root cause

Phase 2645 wired the prepared packet from manifest preflight into operation preparation, but the default generic inference type used by the upstream reasoning/verifier/decision/authority/pipeline chain still defaulted its `input` to raw `RequestTypeDerivationInput`. That meant the runtime value carried inventory, identity-collision witnesses, and request/resource resolution ledgers while the default semantic capability contract did not require those fields. The packet could arrive at the semantic boundary but the type-level authority did not force a production reasoning implementation to consume it.

## Change

Specialized the default `RequestTypeDerivationSemanticInferenceFor<TContract, ...>` defaults throughout the existing upstream capability chain to `RequestTypeDerivationSemanticInputPreparation`. The `infer` and `derive` operations already use `TInference['input']`, so the prepared packet is now the default input contract for the default pipeline composition rather than an optional enrichment. Explicit generic specializations remain possible where a caller deliberately defines another input contract; this change does not manufacture a semantic judgment or proof.

The preparation operation remains the source owner and `RequestTypeDerivationOperationPreparation` passes the packet intact to `pipeline.derive(input)`. The missing production reasoning/verifier/decision/authority implementations remain a real blocker; CLI composition still fails closed and no legacy `RequestType[]` fallback was enabled.

## Validation

- `node scripts/audits/audit-phase2646-prepared-inference-contract.cjs`: structural assertions.
- Full TypeScript check/build/Vitest not run: workspace has no installed `node_modules`; prior global `tsc` is incompatible with the project's `es2025` target and lacks required type packages. This phase is not claimed typecheck-clean.

## Remaining root blocker

The project still needs concrete source-evidence reasoning that emits closed `RequestTypeDerivationJudgment` with source dispositions, contribution receipts, closure/proof ledgers, plus an independent verifier for every canonical law, then a real production composition passed to the CLI. A structural type specialization is not that implementation and is not evidence that the 34 laws have been proved.
