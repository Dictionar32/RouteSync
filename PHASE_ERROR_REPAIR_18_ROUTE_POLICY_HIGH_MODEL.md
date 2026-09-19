# Phase Error Repair 18 — Route Policy High-Level Model

## Root
`RoutePolicyDescriptor` still represented authorization policy model parameters as `string | null` and inferred policy kind from nullable data.

## Trace
`RouteSecurityResolver` → `ScannedRoutePolicyDescriptor` → `RoutePolicyDescriptor` → route contracts.

## Repair
- Added canonical `AbilityName` semantic value object.
- `RoutePolicyDescriptor` is now a closed discriminated union:
  - `ability_model` requires `PropertyName` model parameter.
  - `gate` carries explicit `{ kind: 'none' }`.
  - `custom` carries `{ kind: 'none' } | { kind: 'parameter', name: PropertyName }`.
- `matchRoutePolicy` dispatches exhaustively by the closed discriminator.
- Scanner policy resolver constructs semantic names at the origin boundary.
- Removed canonical `string | null` policy model parameter.
- No fake fallback model name is generated.

## Verification
Static trace/search confirms the canonical domain contract no longer contains `modelParameter: string | null` or `ability: string`.

Full TypeScript compilation could not be run in this checkpoint workspace because `node_modules` / `@types/node` is absent. This is an environment limitation, not treated as a semantic repair.

## Next root
Continue upstream/domain interface audit for remaining primitive semantic fields. `Hash.ts` + Node `crypto` is a separate environment boundary and should not be used to weaken the ADT model.
