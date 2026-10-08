# Phase 1318 — Generator consumes upstream resource-group capability

Date: 2026-10-08

## Trace finding

The scanner route flows already carry closed route capabilities, but the active CLI generator was rebuilding group-level meaning:

- `domainGraphBuilder.ts` selected CRUD versus custom/singleton from `res.index && res.show`.
- `crudGroupBuilder.ts` derived full/read-only/flexible group kind from the presence of create/update/delete slots.
- `singletonGroupBuilder.ts` re-derived custom versus singleton from trailing-parameter presence.
- Both manifest lowerers emitted `routeGroups: []`, so the legacy descriptor list was not a usable source for the generator.

This means “scanner parsing is done” did not yet mean “all semantic decisions are already in the scanner output.” Group shape was still decided in the CLI.

## Change

- Added upstream `ResourceGroupCapabilityContract` / `ResourceGroupShape` and `resourceGroupCapabilitiesFromRoutes`.
- The contract records group name, closed shape, route count, observed closed CRUD roles, and item-route evidence.
- Both route-manifest lowerers populate `resourceGroupCapabilities` from the resolved route flows.
- CLI graph construction consumes the capability and fails closed if no matching closed capability exists.
- CRUD and custom/singleton builders receive the upstream shape as an argument; they no longer choose the shape from route slots or parameter heuristics.
- Added `audit:phase1318-generator-upstream-group-capability` and extended semantic ownership coverage.

## Compatibility boundary

`resourceGroupCapabilities` is temporarily optional on the domain surface so old hand-built manifests can compile. The production lowerers always emit it. The CLI compatibility path delegates missing data to the same upstream authority, then fails closed for unresolved groups. Once all fixtures/external producers carry the contract, make this field required and remove the compatibility path.

`routeGroups` remains an empty legacy descriptor list in the lowerers. Phase 1318 does not claim that list has become the active graph input; it introduces and consumes the explicit group-shape capability instead.

## Validation

- Phase 1318 generator capability audit: 10/10.
- Phase 1317 payload-location evidence audit: 12/12.
- Phase 1309 interface-no-semantic-reasoning: 2/2.
- Phase 1310 downstream no-method-classifier audit: pass.
- Phase 953 ownership audit: clean.
- Full TypeScript build not verified because `node_modules/.bin/tsdown` is absent.
