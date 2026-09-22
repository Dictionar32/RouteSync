# RouteSync Upstream ADT Phase 87.48

## Goal

Move response meaning upward to the Laravel response-contract boundary so downstream passes receive closed semantic data instead of free-form response shapes.

## Flow

Laravel source -> Laravel AST -> verified response declaration -> ResponseContract -> RouteSync IR -> pure lowerers -> emitters.

## Invariants

- Response fields use explicit ADT variants.
- Scalar values are nested under `scalar`; TypeScript primitive names are not the response model.
- Laravel `mixed` becomes `unresolved_declaration`, never an invented `empty_value` or runtime-derived type.
- Named response types carry `ResponseTypeName`, not an untyped string.
- Response cardinality uses the existing `ResponseShape` ADT instead of a free boolean.
- Runtime controller return values do not redefine an explicitly declared response contract.
- Response-level `empty`/`void` remains represented by `VoidResponseDescriptor`, not by a field value.

## ecommerce-shop regression

`#[Response(RegisterResponse::class)]` binds `register.post` to `RegisterResponse`.

`RegisterResponse` declares:

- `success: bool`
- `message: string`
- `data: mixed`

Therefore the verified contract preserves `data` as `unresolved_declaration(mixed_declaration)` and nullable. A runtime `data: null` does not turn the declared response into a different contract.

## Remaining migration boundary

Legacy resource-field descriptors still exist for compatibility with older generators. They must be consumed only at the scanner/compatibility boundary. New semantic consumers should read `ResponseContract` directly.
