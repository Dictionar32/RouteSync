# RouteSync Phase 2629 — Upstream Policy Inventory Interface Wiring

## Root-cause finding

The source-model path already had a named semantic authority (`EffectiveControllerActionPolicySemanticAuthorityInterface`) and a closed source-model result ADT, but controller-action policy inventory was hidden in a private helper and called the resolver function directly. Route-local policy composition also called that resolver directly. This left the canonical judgment contract bypassable at the source-model owner even though the downstream manifest gate was present.

## Changes

- Added `EffectiveControllerActionPolicyInventoryInput` as explicit typed input data.
- Added `EffectiveControllerActionPolicyInventoryInterface` as the closed, versioned operation contract.
- Added `export const effectiveControllerActionPolicyInventory: EffectiveControllerActionPolicyInventoryInterface` and wired source-model construction through `.inventory(...)`.
- Routed route-local policy composition through the existing `effectiveControllerActionPolicySemanticAuthority.judge(...)`, rather than invoking the resolver function directly.
- Preserved the existing controller/action identity, provenance, binding ambiguity judgments, source-model complete-or-blocked ADT, and manifest blocker gate.
- Added `scripts/audits/audit-phase2629-upstream-policy-inventory-interface-wiring.cjs` and registered `audit:phase2629-upstream-policy-inventory-interface-wiring` in `package.json`.
- Did not add `semantic/foundation` dependencies or replace the existing authority with a duplicate.

## Verification performed

| Audit | Result |
|---|---:|
| Phase 2629 — upstream policy inventory interface wiring | 12/12 |
| Phase 2628 — upstream policy identity closure | 11/11 |
| Phase 2627 — upstream manifest source-model gate | 12/12 |
| Phase 2626 — source-model policy inventory closure | 23/23 |
| Phase 2625 — controller-action identity/ambiguity | 11/11 |
| Phase 2387 — manifest-builder operation injection | 12/12 |
| **Total** | **81/81 assertions passed** |

These are structural source audits. A full TypeScript typecheck, Vitest suite, package build, and end-to-end CLI run against Laravel fixtures were not executed in this workspace and are not claimed as passing.

## Remaining validation

Run the full TypeScript typecheck and tests in the project environment. Add or execute an integration fixture with an unbound and an ambiguous controller-action policy, and verify `scan`, `sync`, and drift audit preserve the blocked judgment, exit non-zero, and do not publish a complete manifest.
