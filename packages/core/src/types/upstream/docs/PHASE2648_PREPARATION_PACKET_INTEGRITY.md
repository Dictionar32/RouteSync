# Phase 2648 — Prepared Input Packet Integrity

## Root cause

The manifest path now passes `RequestTypeDerivationSemanticInputPreparation` through the inference contract. However, the source-occurrence verifier previously inspected only the packet's nested raw `input` while checking proof evidence. It did not compare the packet's own `inventory` and `sourceEvidence` against that raw input. A malformed or stale prepared packet could therefore carry one set of inventory/ledger context to reasoning while the guard independently checked a different source view.

## Implementation

`requestTypeDerivationSourceOccurrenceVerification.ts` now receives the complete `RequestTypeDerivationSemanticInputPreparation` packet at its guard boundary. It independently compares, per source domain:

1. canonical evidence keys recomputed from `preparation.input` against `preparation.inventory`;
2. `preparation.inventory` against `preparation.sourceEvidence`;
3. canonical evidence keys from `preparation.input` against proof source evidence.

The existing source identity, occurrence-key, source-coordinate, and input-membership checks remain in place. The guard still delegates remaining semantic laws to the injected complete verifier; it does not claim to be a full proof verifier and does not create a judgment.

## Validation

- Phase 2645 semantic preparation packet flow: 9/9 structural assertions passed.
- The earlier Phase 2646/2647 generic-default checks were superseded and removed in Phase 2649 because they validated a type-shape shortcut, not the missing semantic producer.
- Phase 2648 prepared packet integrity: 9/9 structural assertions passed.

Full TypeScript typecheck, package build, and Vitest were not run successfully in this workspace because project dependencies are not installed and the available global TypeScript compiler is incompatible with the repository's configured target/libs. Structural audits do not substitute for those checks.

## Remaining blocker

This closes a packet-consistency gap only. The repository still needs a concrete production semantic reasoning producer and a complete independent verifier for all 34 canonical laws, composed into the standalone CLI. This guard must not be treated as that verifier.

## Phase 2649 correction

See `PHASE2649_GENERIC_SHORTCUT_REVERT_AND_ROOT_CAUSE.md` at the workspace root. The broad generic-default edits were reverted; this verifier remains a partial packet-integrity guard and is not a substitute for the missing producer or full-law verifier.
