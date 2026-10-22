# Phase2494 — Resource Field Semantic Authority

## Change made

- Added `ResourceFieldSemanticAuthorityInterface` and the closed `ResourceFieldSemanticJudgment` result in the upstream contract layer.
- Added `resourceFieldSemanticAuthority` under `compiler/semantic` and declared its public value using the upstream interface.
- Routed `meaning` and `type` production in `resourceFieldProducer` through that judgment. The authority now uses resolved model source types directly rather than round-tripping through the scanner's `semanticTypeCanonical` helper.
- Exported the interface through the upstream barrel.

## Deliberate scope boundary

This is the first Resource sub-boundary, not a claim that the entire Resource scanner is interface-first yet. `resourceFieldProducer` still assembles output shape and nested fields; it still imports `semantic/relations`. The top-level `resourceProducer`, `resourceAstExpressionMapper`, `resourceBinder`, and `resourceSourceEvidence` also retain relation dependencies, and the canonical scanner still imports the producer through `subscanners`.

## Next required work

1. Introduce a closed upstream output-shape judgment so the field producer projects rather than classifies `resource_single`, `resource_collection`, and nested arrays.
2. Move method/feature/wrapping/resource-response judgments out of `resourceProducer` into the proper semantic authority and evolve the existing producer contract rather than adding a duplicate producer interface.
3. Wire canonical scanner and binder to the same operation contract, then retire `subscanners` only after all consumers are traced.
4. Remove relation/foundation dependencies by replacing semantic relation imports with explicit typed judgments/operations at the correct owner—not by recreating relation helpers locally.

## Validation

`node scripts/audits/audit-phase2494-resource-field-upstream-authority.cjs` checks the contract, owner, wiring, and remaining known debt. Full typecheck/build/test/CLI verification is not claimed because the repository's global `tsc` is older than the project's configured target and reports pre-existing parse errors in `effectiveControllerActionPolicyResolver.phase921.test.ts`.
