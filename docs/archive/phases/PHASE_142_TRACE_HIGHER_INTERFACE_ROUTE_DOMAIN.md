# Phase 142 — Trace Higher Interface: Route → Domain Response Semantics

## Boundary
`ecommerce_shop → AST/ADT → ParsedRoute → EndpointContract → ResourceGroup/DomainGraph`

## Changes
- `ResponseDescriptorBase` now owns `responseTypeName()` as canonical semantic projection.
- `ResponseDescriptorBase` now owns `toSuccessStatusCode()` for response-specific success semantics.
- Resource/model/inline/void response descriptors implement those projections.
- Removed downstream `switch (analysis.kind)` from resource group response type derivation.
- Removed downstream response-kind ternary from endpoint contract construction.
- Endpoint contract now consumes response meaning directly from `RouteBindingContract.response`.

## Deliberate boundary rule
Ternary/if/switch used to construct/classify meaning at the origin boundary may remain inside the origin classifier. They must not reappear downstream merely to reconstruct meaning already represented by the ADT.

## Remaining trace target
`ResourceGroupDescriptor → ResourceGroupGraph → ClassifiedDomainGraph → compiler passes`

The remaining `?? 'never'` in resource-group type signature construction represents absence of optional CRUD routes. This is a candidate for the next higher-model pass: encode role presence in the existing resource-group ADT rather than making consumers recover it from a Map.

## Validation
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reaches the existing environment blocker:
`packages/core/src/compiler/utils/Hash.ts: Cannot find module 'crypto' or its corresponding type declarations.`
No new TypeScript error was produced by the response-model changes before that blocker.
