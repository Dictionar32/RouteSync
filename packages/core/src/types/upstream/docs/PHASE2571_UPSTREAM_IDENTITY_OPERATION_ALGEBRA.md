# Phase 2571 — Upstream Identity Operation Algebra

## Root-cause finding

The canonical source identity implementation already existed upstream and its aggregate object already satisfied `RequestTypeDerivationSourceEvidenceInventoryInterface`. However, the individual canonical identity operations and inventory constructor were private implementation details. Consumers and auditors could only see the aggregate object, which made the identity algebra harder to compose and verify as explicit operations.

## Change

The existing contract was reused; no duplicate interface was introduced. The following operations are now individually exported and each is typed directly from the matching property of `RequestTypeDerivationSourceEvidenceInventoryInterface`:

- `canonicalRouteIdentity`
- `canonicalResourceIdentity`
- `canonicalRequestIdentity`
- `canonicalRouteOccurrenceKey`
- `canonicalResourceOccurrenceKey`
- `canonicalRequestOccurrenceKey`
- `inventoryRequestTypeDerivationSourceEvidence`

The aggregate `requestTypeDerivationSourceEvidenceInventory` now wires these same operation values. Identity keys remain distinct from source-occurrence keys. Source occurrence identity continues to encode the file component before serializing the `(file, start, end)` tuple.

## Active-path impact

The existing source-occurrence verifier continues to consume the aggregate upstream operation and therefore uses the same canonical identity functions. No CLI fallback, legacy solver, `semantic/foundation`, or `semantic/relations` dependency was added.

## Explicit limitation

This is a real interface-first identity-operation refactor, not completion of the RequestType semantic producer. The CLI manifest path still lacks a concrete production reasoning implementation and an independent verifier for all 32 derivation laws. Phase 2571 does not claim to create a verified semantic judgment or complete the CLI production composition. The next root-cause task remains implementing that producer and complete verifier, then wiring them into the existing pipeline and CLI composition.

## Validation

Run `npm run audit:phase2571-upstream-identity-operation-algebra`. This is a structural audit plus TypeScript syntax transpilation, not a full typecheck, build, Vitest, or CLI end-to-end run.
