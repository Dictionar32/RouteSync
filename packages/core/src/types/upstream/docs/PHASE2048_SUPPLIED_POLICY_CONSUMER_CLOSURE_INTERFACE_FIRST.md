# Phase 2048 — Supplied Effective Policy Consumer Closure

## Trace finding

`highLevelSourceModel.ts` consumed `EffectiveControllerActionPolicy` as if every supplied policy were complete. The closed ADT from Phase 2047 allows a blocked policy to contain identity and a blocked judgment only, so reading `suppliedPolicy.middleware` or `suppliedPolicy.authorization` before discriminating the judgment violates the upstream contract. A second leak existed after route composition: authorization was spread onto the route-policy result without first checking whether route middleware had made that result blocked.

## Change

- Branch on the supplied policy's `judgment` before reading complete-only products.
- A blocked supplied policy remains blocked, carries the route source span, and merges any blocked route/resource middleware-scope reasons without exposing middleware or authorization products.
- For a complete supplied policy, compose route/resource middleware through the existing upstream policy resolver.
- Branch again on the composed route-policy judgment. Authorization is attached only to the complete variant; a blocked route policy is projected as blocked unchanged.
- Preserve the existing canonical invocation judgment and integrated response path. No relation/foundation subscanner was added.

## Boundary

This patch closes the existing consumer against the canonical upstream ADT; it does not introduce a second policy authority or relocate semantic reasoning into scanner runtime. The route relation projection remains a downstream representation, not a subscanner or semantic authority.

## Verification limits

The phase audit checks the closed-ADT consumer boundary and the preserved invocation/response wiring. It is a structural audit, not a TypeScript typecheck or execution of the Vitest regression suite.
