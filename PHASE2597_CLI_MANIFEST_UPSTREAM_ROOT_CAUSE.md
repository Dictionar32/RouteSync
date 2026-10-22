# RouteSync Phase 2597 — CLI / Manifest / Upstream Root-Cause Follow-up

## Scope

Continue from Phase 2596 without pretending the missing production semantic producer or full verifier exists. The target is the actual dispatch boundary between the CLI executable and the upstream semantic composition.

## Source-root defect repaired

`packages/cli/src/index.ts` previously had an `available` arm in the standalone executable that called `program.parse(process.argv)`, even though `program` had been created independently by `createProgram()` without the semantic composition that produced the resolution. The resolution ADT only carried a semantic pipeline, not the canonical manifest composition or the full upstream capability bundle. If that arm ever became reachable, the executable could dispatch a program that was not created from the resolved composition.

The arm now fails closed with an explicit diagnostic. A pipeline-only resolution cannot be treated as proof that the CLI program is correctly composed.

## Confirmed upstream blockers

1. No concrete production implementation of `RequestTypeDerivationSemanticReasoningInterface` is wired to produce the source-bound judgment and complete proof packet.
2. No single independent production verifier establishes all 34 `REQUEST_TYPE_DERIVATION_LAW_IDS`; the source-occurrence guard remains a partial decorator.
3. The standalone executable has no production composition root supplying reasoning, verification, decision, authority, integrity, and the canonical manifest composition together.

## Required next evolution

- Keep source inventory and canonical identity/occurrence identity upstream-owned.
- Implement reasoning against `RequestTypeDerivationInput`, producing a closed judgment with route/resource/request dispositions, unresolved/conflict ledgers, contribution receipts, and source-bound proof.
- Implement an independent verifier that establishes every one of the 34 canonical laws from the inference packet; do not infer validity from the inventory's existence or a partial guard.
- Compose those existing capability interfaces with the manifest authority in one executable composition root.
- Make the executable parse only a program created from that same complete composition.

## Validation

Run `node scripts/audits/audit-phase2597-cli-manifest-upstream-root-cause.cjs` and the existing Phase 2596 audit. These are structural audits, not substitutes for typecheck, Vitest, build, or a real Laravel-project integration run.
