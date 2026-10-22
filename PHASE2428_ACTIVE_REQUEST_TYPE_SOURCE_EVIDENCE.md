# Phase 2428 — Active RequestType Source-Evidence Wiring

## Change

The active manifest lowering now calls the canonical `RequestTypeDerivationSourceEvidenceInventoryInterface` operation with the same `routes`, `resources`, and `requests` collections passed to the existing projection call. The resulting route/resource/request evidence references are retained by the lowering and projection contracts. Both CLI `scan` and `sync` write `routesync.request-type-source-evidence.json` alongside their output artifacts.

The evidence inventory retains source occurrence coordinates and domain-specific ADT variants. It does not infer RequestType semantics, fabricate a judgment, or claim proof-law verification. No `semantic/relations` or `semantic/foundation` import was added to the evidence inventory.

## Validation

- `node scripts/audits/audit-phase2426-request-type-source-inventory.cjs`: 8/8 passed.
- `node scripts/audits/audit-phase2427-request-type-evidence-wiring.cjs`: 7/7 passed.
- `node scripts/audits/audit-phase2428-active-request-type-source-evidence.cjs`: 9/9 passed.

## Remaining root-cause blocker

This change does **not** close the interface-first semantic producer. The active lowering still invokes `requestTypeDerivationProjectionPipeline.derive(...)`, which uses the legacy solver. The repository still needs a real production implementation of the existing reasoning, verifier, decision, and authority capabilities that emits and independently verifies the closed judgment/proof required by all 32 canonical laws. Until that producer exists and is wired into the active manifest/CLI composition, this phase must not be described as end-to-end interface-first closure.

Full TypeScript typecheck, package build, Vitest, and live CLI integration are not claimed by this audit.
