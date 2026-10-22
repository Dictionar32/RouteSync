# RouteSync Phase 2551 — Canonical Source Inventory Binding

## Root cause

Phase 2550 forwarded the preflight `sourceEvidence` packet through manifest projection, but the active `RequestTypeDerivationProjectionInput` did not include that evidence. Consequently, the legacy solver could consume request/resource resolution ledgers while treating the preflight inventory as output-only metadata. Its route/resource/request AST values were reconstructed from the manifest, but there was no explicit check that this second representation had exactly the same source occurrence set and identity/location evidence as the upstream packet.

## Implementation

- Added `sourceEvidence` to the existing projection input contract; no duplicate interface was introduced.
- Active manifest lowering passes the exact preflight evidence to the existing interface-valued solver operation.
- The solver validates cardinality and binds each supplied evidence item to exactly one expected source domain + occurrence key, then checks semantic key, canonical identity key, and source location before constructing the derivation context.
- The compatibility facade obtains source evidence and both resolution ledgers from the same inventory operation and passes them through the same contract.
- Validation is fail-closed: evidence mismatch throws before grouping rather than allowing the solver to proceed on detached ledgers.

## Boundary of the fix

This closes source-inventory binding at the legacy projection boundary. It does **not** implement the missing production `RequestTypeDerivationJudgment` producer or the independent verifier for all 32 laws, and it does not remove `semantic/relations` from the active solver. The active path still returns `RequestType[]`; it must not be described as a verified semantic judgment pipeline.

## Verification

Run `npm run audit:phase2551-canonical-source-inventory-binding`. Full build and CLI end-to-end verification remain separate requirements.
