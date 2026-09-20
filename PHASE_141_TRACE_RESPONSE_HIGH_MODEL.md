# Phase 141 — Trace Response Interface to Higher Semantic Model

## Source truth

`ecommerce_shop` is the source workspace. RouteSync consumes its Laravel source; the Laravel project is not modified to fit RouteSync.

## Trace

`ecommerce_shop controller/resource → PHP AST → ControllerExpressionContract → ResponseDescriptor → RouteBindingContract`

## Information-loss finding

`bindingBuilder.ts` previously classified `ResponseDescriptor` using a nested ternary over `responseAnalysis.kind` and reconstructed the response type name in the boundary.

That meant the boundary had to rediscover a fact already owned by the response descriptor.

## Repair

The existing `ResponseDescriptorBase` model was raised with the semantic operation:

`responseTypeName(): ResponseTypeName`

Every existing response variant now owns its response type-name meaning:

- `ResourceResponseDescriptor` → `<Resource>Response`
- `ModelResponseDescriptor` → `<Model>Response`
- `InlineResponseDescriptor` → its canonical `typeName`
- `VoidResponseDescriptor` → `void`

No parallel interface was introduced.

## Result

Before:

`ResponseDescriptor → toAnalysis() → kind classification → ternary → responseTypeName`

After:

`ResponseDescriptor → responseTypeName()`

The boundary now consumes a semantic capability already carried by the model.

## Invariant

A downstream boundary must not classify a closed semantic model merely to reconstruct a value that the model itself can provide.

The ternary used for response classification is therefore removed from this boundary. Source-level PHP ternary syntax remains represented as AST and is not confused with domain classification.

## Next trace target

Continue upward from `RouteBindingContract → ParsedRoute → RouteManifest → DomainGraph` and search for:

- boolean fields encoding closed semantic variants
- optional fields requiring fallback classification
- strings reconstructed from multiple semantic fields
- downstream `kind` classification that duplicates an upstream ADT
- response/resource shape conversion repeated after the boundary
