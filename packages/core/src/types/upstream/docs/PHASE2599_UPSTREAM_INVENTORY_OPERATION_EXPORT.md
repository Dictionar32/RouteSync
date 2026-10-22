# Phase 2599 — Upstream Inventory Operation Export Boundary

## Scope

Make the existing upstream-owned source-evidence inventory operation algebra reachable through the public `@routesync/core` barrel. This phase does not claim to complete the semantic judgment producer or the independent 34-law proof verifier.

## Trace

1. `types/upstream/requestTypeDerivationInterface.ts` declares `RequestTypeDerivationSourceEvidenceInventoryInterface`, canonical identity ADTs, occurrence-key domains, evidence-reference ADTs, and the closed 34-law inventory.
2. `compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts` implements each operation with an explicit `ExistingInterface['operation']` annotation.
3. Internal semantic and manifest-preflight consumers already call the aggregate inventory operation.
4. The core barrel previously exported only the aggregate inventory and evidence-key projection. Named canonical identity/occurrence operations and the law identifier/coverage types were not exposed together as a public operation algebra.
5. CLI composition still requires a supplied semantic pipeline plus manifest composition; exposing identity operations does not manufacture semantic judgments or proofs.

## Change

- Export the six existing named canonical identity/occurrence operations and the two inventory projections from `@routesync/core`.
- Export `REQUEST_TYPE_DERIVATION_LAW_IDS` and the associated closed law-coverage/policy/input/evidence-reference types.
- Keep executable implementations under `compiler/semantic`; do not move runtime implementation into `types/upstream`.
- Add `scripts/audits/audit-phase2599-upstream-inventory-operation-export.cjs` to verify contract ownership, operation-to-interface typing, public export reachability, and continued CLI composition gating.

## Remaining root blocker

The production CLI path remains intentionally closed until a concrete semantic reasoning producer and independent verifier can produce/check a source-bound judgment across all 34 laws, then be supplied through the existing composition root. This phase improves the public contract path only; it does not claim end-to-end CLI readiness.
