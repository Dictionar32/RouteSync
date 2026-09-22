# Phase 98 — Interface Data-Free Trace / ecommerce_shop

## Objective

Remove open semantic states from the response, relation, and error-response boundaries. Primitive leaf values remain legal; semantic meaning must not be encoded by optional/null/Record/unknown channels.

## Fixed boundaries

1. `response-field/types.ts`
   - `ResponseFieldData` is now a closed union.
   - object fields and array item are required by their variant.
   - variable/property-access resolution is required.
   - presence is an ADT (`required | nullable | optional | optional_nullable`).
   - resolved values are a closed union (`reference | type | unresolved`).
   - nested fields use ordered typed entries rather than `Record<string, ...>`.

2. `ResponseStructureBuilder.ts`
   - accepts typed field entries rather than `Record<string, ResponseFieldData>`.
   - no optional probing for object/array children.

3. `model/relation/types.ts`
   - `foreignKey` is now a closed ADT: `convention | explicit`.
   - no `string | null` in the scanned relation contract.

4. `model/relation/relationFactories.ts`
   - convention is represented structurally instead of `null`.

5. `route/error-response`
   - error schema is now `HttpErrorSchema` with typed field entries.
   - descriptor no longer exposes `Record<string, unknown>`.

## Remaining open semantic boundaries found during trace

These are intentionally not hidden behind another fallback:

- `routeEntityDefinition.ts` and `domain/contracts.ts`: response/request schema still has `Record<string, unknown>`.
- `ResourceMapperBuilder.buildValidationRules`: accepts `Record<string, unknown>`.
- `requestModels.ts`: transport conversion uses records at the external object boundary.
- `routeSecurity.ts`: model parameter still uses nullable primitive state.
- `resourceDescriptorTypes.ts`: base/model identity still uses nullable primitive state.
- `typeDeriverUtils.ts`: scanner derivation input is still a bag of optional primitives.
- `InvalidationResolver.ts`: response re-classification still probes properties dynamically.
- generated query-key builders still emit `string | number | Record<string, unknown>` parameter unions.

## Verification note

The supplied repository already contains unrelated TypeScript errors in the existing semantic/domain migration. Therefore a workspace-wide green build cannot be claimed from this phase. The Phase 98 changes are isolated to the listed interfaces and their direct consumers; existing errors remain separately identifiable.
