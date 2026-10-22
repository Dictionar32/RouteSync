# RouteSync Phase 2637 — Upstream Contract Audit Repair

Date: 2026-10-21

## Changes implemented in this workspace

- Repaired `scripts/audits/audit-phase2534-canonical-request-type-contract.cjs`.
- Removed its dependency on the retired `packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts` path.
- Removed its dependency on loading TypeScript just to inspect the canonical contract; the audit can run with Node built-ins in a source archive without `node_modules`.
- Updated the audit to the actual canonical contract: all 34 law IDs, all 34 witness obligations, and all 34 required coverage entries must match exactly.
- Updated projection checks to follow current `routeManifestProjection.ts`, `routeManifestProjectionAuthority.ts`, and `routeManifestTypeLoweringAuthority.ts`.
- Added explicit checks that blocked derivation variants remain typed and the active projection path does not import the retired lowering module.
- Reused the existing upstream interface and contract; no duplicate interface, v2 contract, fallback, or fake semantic proof was introduced.

## Root-cause status

The stale audit was a verification-path defect: it read a deleted/retired lowering file and expected 33 laws while the canonical contract now contains 34. This is now fixed and the audit passes against the current source paths.

The production semantic kernel remains a separate, unresolved implementation gap. `RequestTypeDerivationSemanticPipelineAssembler` wires injected reasoning, verifier, decision, authority, and integrity capabilities; it does not implement them. This patch deliberately does not mark laws verified or adapt the legacy `RequestType[]` solver as proof. The CLI continues to fail closed when its host composition is missing or invalid.

## Verification executed

All scripts below were run directly with Node in the extracted workspace (no `node_modules` present):

- `audit-phase2534-canonical-request-type-contract.cjs` — 11/11
- `audit-phase2636-upstream-manifest-authority-trace.cjs` — 11/11
- `audit-phase2591-cli-manifest-upstream-closure.cjs` — 8/8
- `audit-phase2614-manifest-upstream-contract-alignment.cjs` — 7/7
- `audit-phase2632-request-type-production-capability-root-cause.cjs` — 11/11
- `audit-phase2633-cli-preflight-packet-identity.cjs` — 10/10
- `audit-phase2634-cli-semantic-authority-single-gate.cjs` — 10/10
- `audit-phase2579-authority-integrity-closed-adt.cjs` — 13/13

Total: 81/81 structural assertions passed across these eight audit scripts. This is not a substitute for TypeScript typecheck, Vitest, package build, or Laravel end-to-end behavior tests; those were not run because dependencies are not installed in this workspace.

## Next required implementation

Implement the source-bound reasoning operation and an independent verifier for all 34 obligations under `packages/core/src/compiler/semantic/request-type-derivation/`, using the existing interfaces in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`. Connect them through the existing assembler and host composition. Add behavioral Laravel fixtures for exact/normalized identity, ambiguity, duplicate occurrences, contribution conflicts, incomplete closure, forged witnesses, and source-location mismatch before declaring semantic closure.
