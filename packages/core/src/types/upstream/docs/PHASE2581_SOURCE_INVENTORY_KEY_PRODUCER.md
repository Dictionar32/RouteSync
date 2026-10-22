# Phase 2581 — Source Inventory Key Producer

## Root cause

`requestTypeDerivationSourceOccurrenceVerification.ts` owned a local `inputEvidenceKeys(input)` operation that projected the route/resource/request key ledger. The logic called the canonical upstream inventory, but the key projection itself was still compiler-owned rather than part of the upstream inventory contract. That left the source-inventory law split across semantic ownership and verification wiring.

## Upstream-first evolution

- Extended the existing `RequestTypeDerivationSourceEvidenceInventoryInterface` with the typed `evidenceKeys(input)` operation. No duplicate interface was introduced.
- Added `requestTypeDerivationSourceEvidenceKeys`, typed from that existing interface property. It delegates to the existing canonical inventory constructor and returns a frozen ledger of route, resource, and request semantic keys.
- Connected the operation through the aggregate `requestTypeDerivationSourceEvidenceInventory` and the public `packages/core/src/index.ts` export.
- Removed the compiler-local `inputEvidenceKeys` implementation. The source-occurrence verifier now consumes `requestTypeDerivationSourceEvidenceInventory.evidenceKeys(input)` and remains responsible only for checking the inventory law and producing its typed counterexample.
- Kept canonical identity production in the existing upstream identity operations. No semantic foundation/relation or legacy solver dependency was added.

## Path trace

`RequestTypeDerivationInput` → upstream `RequestTypeDerivationSourceEvidenceInventoryInterface.evidenceKeys` → `requestTypeDerivationSourceEvidenceKeys` → aggregate upstream inventory object → core public export → source-occurrence verifier's `source_evidence_inventory_matches_input` law → canonical verification counterexample or delegation to the injected complete verifier.

This phase closes the key-ledger ownership gap. It does not claim to implement the full RequestType semantic reasoning producer, full proof verifier, or default CLI production composition.

## Executed validation

- `node scripts/audits/audit-phase2581-source-inventory-key-producer.cjs`: 17/17 assertions passed, including syntax transpilation for the verifier, upstream contract, upstream producer, and core public entry.
- Phase 2576 audit: 13/13 passed.
- Phase 2577 audit: 12/12 passed.
- Phase 2578 audit: 14/14 passed.
- Phase 2579 audit: 13/13 passed.
- Phase 2580 audit: 12/12 passed.
- Phase 2561 CLI manifest/upstream composition audit: 15/15 passed.
- Phase 2565 manifest-builder operation-injection audit: 15/15 passed.
- Historical Phase 2539 audit: 9/12 passed. Its three failures assert an older CLI/preflight/projection path and are inconsistent with the later Phase 2561 composition audit, which passes. Treat Phase 2539 as a stale regression audit needing reconciliation, not as evidence that those later checks passed.
- Full semantic typecheck, package build, Vitest, and CLI E2E were not run in this environment; syntax transpilation is not a substitute for them.
