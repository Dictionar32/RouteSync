# Phase 2050 — Canonical Policy Inventory Is Wired at the Source-Model Boundary

## Trace finding

`sourceModelReferenceIndexFromCatalog(catalog, effectivePolicies)` supported a canonical effective-policy input, but the only production source-model builder called it with `catalog` alone. Therefore the Phase 2049 ownership rule was not exercised by the production construction path: its effective policy inventory was empty by default.

## Change

The source-model builder now derives one effective policy per typed controller-action using the existing `EffectiveControllerActionPolicyUpstreamInput` contract and `resolveEffectiveControllerActionPolicyUpstream`. It passes that inventory into `sourceModelReferenceIndexFromCatalog(catalog, effectivePolicies)`.

The controller policy inventory contains controller/action identity, controller policy evidence, inherited controller identity, and source provenance. Route middleware is deliberately not folded into this inventory: route-specific declarations and resource middleware continue to be composed at the route projection boundary.

## Invariants

- Existing upstream policy resolver remains the semantic authority.
- `EffectiveControllerActionPolicy` remains a closed `complete | blocked` ADT.
- Controller raw evidence is fallback-only when no canonical effective policy owns the same controller/action.
- Route-specific policy composition remains separate from controller-action policy identity.
- Invocation judgment and integrated response wiring are unchanged.
- No `relation` or `foundation` subscanner is added.

## Verification boundary

The Phase 2050 audit checks source wiring, contract use, provenance, route-policy separation, invocation/response continuity, and absence of forbidden subscanner directories. This is structural verification, not a full TypeScript typecheck or build.
