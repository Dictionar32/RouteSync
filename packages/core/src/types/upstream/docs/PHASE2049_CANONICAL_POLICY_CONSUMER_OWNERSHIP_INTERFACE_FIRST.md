# Phase 2049 — Canonical Policy Consumer Ownership

## Trace finding

`sourceModelReferenceIndexFromCatalog(catalog, effectivePolicies)` projects effective controller-action policy relations into the graph and also projected raw controller policy evidence for every catalog controller action. When callers supplied an effective policy for an action, both sources could describe the same controller/action policy scope. The direct graph lane is canonical effective policy; the raw catalog evidence lane is useful only when no effective policy owns that action.

## Contract correction

The controller evidence projection now resolves whether `effectivePolicies` contains the same typed controller/action identity. If an effective policy owns that action, the graph keeps the effective policy projection and suppresses the raw evidence projection for that same action. This applies to both closed ADT variants: `complete` contributes its available products; `blocked` contributes only the blocked judgment. A blocked canonical policy cannot be bypassed by falling back to raw controller policy evidence.

This is a source-ownership correction, not a new policy authority. The existing `EffectiveControllerActionPolicy` remains the canonical policy contract; `highLevelSourceModel.ts` is only wiring the graph projection according to that ownership. Route-action projections remain separate because they encode route identity and are not duplicates of controller-action relations.

## Boundaries preserved

- No `relation` or `foundation` subscanner was added.
- No duplicate invocation or response semantic authority was introduced.
- Existing invocation semantic judgment and integrated response projection remain unchanged.
- Runtime/build verification was not run as part of this phase.
