# Phase 2649 — Revert Generic Contract Shortcut; Return to the Actual Blocker

## Correction

Phases 2646 and 2647 changed generic defaults from `RequestTypeDerivationInput` to `RequestTypeDerivationSemanticInputPreparation` at multiple contract sites. This constrained the default type shape, but did not add a production reasoning producer, create a semantic judgment, generate contribution receipts, or verify the 34 canonical laws. Treating those changes as progress toward closing the producer gap was incorrect.

The broad generic-default edits have been reverted in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`. Their structural audits were removed from the package scripts and workspace because they certified the type-shape change rather than the missing semantic implementation.

## Confirmed source root cause

The production composition in `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts` only assembles capabilities injected by a caller. It explicitly states that concrete production reasoning, proof verification, decision, and authority capabilities are not supplied.

The CLI composition loader in `packages/cli/src/standaloneCompositionLoader.ts` loads a host-owned semantic composition module. The CLI entrypoint does not own a concrete producer that can create `RequestTypeDerivationJudgment` from the manifest's route/resource/request evidence. The existing assembler and source-occurrence guard are not substitutes for that producer or a complete verifier.

## What remains correct

- The Phase 2645 prepared packet still flows from manifest preflight to operation preparation.
- The Phase 2648 packet integrity guard still compares prepared inventory and source evidence with the packet's raw input and checks proof evidence against source input.
- The active CLI remains fail-closed when the host-owned semantic composition is missing; no legacy `RequestType[]` fallback was introduced.
- No `semantic/foundation` dependency was added.

## Validation

The two generic-shortcut audit scripts were removed rather than left as misleading green checks. The Phase 2648 packet integrity audit should be run independently. Full typecheck/build/Vitest are not claimed: the workspace does not have project dependencies installed and the available global TypeScript compiler is incompatible with the configured project target/libs.

## Actual next implementation

Implement the named production `RequestTypeDerivationSemanticReasoningInterface` producer over the existing canonical source inventory, request/resource resolution ledgers, action/response contribution operations, source dispositions, group contribution receipts, and closure ADT. Then implement an independent verifier that checks every law in `REQUEST_TYPE_DERIVATION_LAW_IDS`, compose decision and authority through the existing assembler, and supply that concrete composition to the standalone CLI. Do not wrap a legacy `RequestType[]` result as a proof-backed judgment or mark laws verified without checking them.
