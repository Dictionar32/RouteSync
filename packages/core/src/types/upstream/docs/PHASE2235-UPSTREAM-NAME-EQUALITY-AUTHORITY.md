# Phase 2235 — Upstream Name Equality Authority

## Root cause

The resource-binding authority depended on `semantic/relations` only to compare method names. The upstream `names.ts` module also imported that relation facade for basic name equality. This made a domain authority depend on a lower-level semantic relation/foundation path for a primitive identity operation and obscured ownership of name equality.

## Change

- Added `StringValueEqualityInterface` to the existing upstream value-object owner.
- Added the upstream `stringValueEquality` implementation for `StringValue` identity.
- Routed existing class-name, variable-name, model/class-name and method-name equality helpers through that contract.
- Routed resource static-call rule applicability through `methodNameEquals`.
- Removed direct relation/foundation imports from `names.ts` and `controllerResourceBindingAuthority.ts`.
- Advanced `ControllerResourceBindingAuthorityInterface.contractVersion` from 7 to 8.
- Synchronized `judgmentContract` and `responseContractRule` runtime metadata with the declared interface contract.

## Authority boundary

The resource-binding authority still owns applicability judgment and canonical publication. This change does not add another authority and does not reclassify the resource-binding judgment in the action adapter.

## Explicitly open migration debt

The production Laravel controller execution path still imports `scanControllerAction`, `controllerProducer`, `readSourceText`, and `controllerBodySemanticJudgmentAuthority` from `subscanners/controller`. Phase 2235 does not claim that subscanner migration is complete. The next cutover must replace those production dependencies with the existing upstream contracts and source-correlated inputs, then remove the legacy call path only after its semantic outputs are accounted for.

## Validation boundary

The structural audit verifies the new ownership and dependency boundary. Vitest, TypeScript type-check, and full build were not run in this phase.
