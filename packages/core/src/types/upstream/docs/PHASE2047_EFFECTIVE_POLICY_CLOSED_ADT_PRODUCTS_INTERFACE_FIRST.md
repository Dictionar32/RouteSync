# Phase 2047 — Effective policy closed ADT products

## Trace finding

`EffectiveControllerActionPolicy` previously exposed `middleware` and `authorization` arrays alongside a nested `complete | blocked` judgment. That allowed a consumer to access policy products without first proving the judgment was complete. The relation projection correctly returned only a blocked relation for blocked policies, but the value contract itself still exposed partial products.

## Interface-first correction

The existing `EffectiveControllerActionPolicy` is now a closed discriminated union:

- `CompleteEffectiveControllerActionPolicy` carries `judgment: complete`, middleware, and authorization products.
- `BlockedEffectiveControllerActionPolicy` carries the identity, `judgment: blocked`, and reasons, but has no middleware or authorization fields.

Both existing resolvers now branch on the closed judgment and only attach products to the complete variant. `controllerActionPolicyRelations` switches on the judgment before projecting products. No new authority, relation/foundation subscanner, or duplicate invocation/response semantic path was added.

## Preserved boundaries

The Laravel invocation semantic judgment and integrated response pipeline remain unchanged. The controller action policy relation projection remains a downstream projection, not a second policy authority.

## Verification boundary

The Phase 2047 audit verifies the ADT shape, both resolver branches, guarded projection, regression coverage, existing invocation wiring, and absence of relation/foundation subscanners. The audit is structural; it does not replace TypeScript type-checking or executing the test suite.
