# RouteSync Phase 2639 — Semantic Input Preparation Interface-First Cutover

## What changed in source

The manifest preflight previously assembled source inventory, request-resolution receipts, and resource-resolution receipts directly inside scanner wiring. That made scanner wiring own part of the semantic preparation sequence even though the component operations already belonged to the semantic layer.

The active path now delegates that sequence to the interface-first semantic operation:

`packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
- Adds `RequestTypeDerivationSemanticInputPreparation` as a typed packet for source inventory and both resolution ledgers.
- Adds `RequestTypeDerivationSemanticInputPreparationInterface` as the upstream operation contract.
- Explicitly states that this packet is not a semantic judgment and does not prove the 34 laws.

`packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts`
- Implements `prepareRequestTypeDerivationSemanticInput` with the requested `export const name: Interface['operation']` form.
- Exposes the object-level operation `requestTypeDerivationSemanticInputPreparation: RequestTypeDerivationSemanticInputPreparationInterface`.
- Builds one canonical source inventory and uses that same inventory for request and resource resolution.
- Returns source evidence and both typed assessments without manufacturing a RequestType judgment or proof.

`packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts`
- Now owns only manifest-to-semantic-input adaptation and delegates semantic preparation upstream.
- Does not import the inventory or resolution operations directly.

`packages/core/src/index.ts`
- Exports the new upstream contract types and semantic preparation operation.

## Correctness boundary

This fixes ownership and wiring for the manifest evidence-preparation segment. It does **not** close the production semantic-kernel gap. The concrete source-bound reasoning producer and independent verifier for all 34 laws remain absent; the CLI still correctly fails closed without host composition. No fabricated proof, legacy solver fallback, `semantic/foundation`, or relation dependency was introduced.

## Verification

Run `node scripts/audits/audit-phase2639-semantic-input-preparation-interface-first.cjs` and the Phase 2638, 2552, 2538, 2534, and 2636 audits. These are structural/source-path assertions, not substitutes for TypeScript typecheck, unit tests, build, or Laravel end-to-end tests. The workspace archive has no installed `node_modules`, so those checks are not claimed here.
