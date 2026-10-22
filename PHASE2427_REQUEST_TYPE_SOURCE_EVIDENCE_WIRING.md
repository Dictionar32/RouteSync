# Phase 2427 — RequestType Source Evidence Wiring

## Implemented in the Phase 2425 workspace

- Connected `createRequestTypeDerivationSourceEvidenceInventory()` to the authority-backed manifest lowering path.
- The inventory and runtime executor receive the exact same frozen `{ routes, resources, requests }` input.
- The authority-backed lowering result now carries the source-reference ADTs for routes, resources, and requests on both the projected and non-projectable branches.
- The authority-backed projection wrapper preserves those references instead of dropping them.
- No `semantic/relations` or `semantic/foundation` import was added; no judgment or proof was fabricated.

## Validation

- `node scripts/audits/audit-phase2426-request-type-source-inventory.cjs`: PASS 8/8.
- `node scripts/audits/audit-phase2425-request-type-semantic-producer-closure.cjs`: PASS 6/6. This is a blocker audit, not proof of closure.
- `node scripts/audits/audit-phase2427-request-type-evidence-wiring.cjs`: PASS 7/7.
- TypeScript `transpileModule` syntax checks for the inventory and both edited wiring files: PASS 3/3, zero syntax diagnostics.
- Full typecheck, package build, Vitest, and live CLI integration have not been validated in this phase.

## Remaining root cause — not closed

The default active `routeManifestTypeLowering.ts` still calls `requestTypeDerivationProjectionPipeline.derive(...)`, which reaches the legacy solver. The repository still lacks a production implementation of the existing source-to-judgment reasoning, complete 32-law verifier, decision, and authority capabilities. Therefore this change improves the injected authority path's evidence traceability but does **not** make the active CLI path interface-first end-to-end. The legacy bypass must not be removed until a genuine proof-producing semantic pipeline is implemented and wired; a bare `RequestType[]` must not be relabeled as proof.
