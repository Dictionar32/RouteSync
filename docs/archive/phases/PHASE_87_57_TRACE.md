# RouteSync Phase 87.57 — ecommerce_shop Response Semantic Closure

## Trace

`ecommerce_shop Laravel AST`
→ response declaration / route descriptor
→ `ResponseResolver`
→ `ResolvedResponse` / `ResolvedRoute`
→ contract / mapper consumers

The AST boundary already preserves structure such as property access, closures,
arrow static calls, and response declarations. The semantic resolver was still
re-encoding response meaning as four independent booleans:
`isCollection`, `isPaginated`, `isWrapped`, `isNullable`.

## Fix

Response meaning is now represented by closed ADTs:

- `ResponseCardinality`: `single | collection | paginated_collection`
- `ResponseEnvelope`: `direct | wrapped`
- `ResponseNullability`: `non_nullable | nullable`

`ResponseResolver` converts manifest response metadata into these states once.
Downstream no longer receives independent collection/pagination flags.

## ecommerce_shop invariant

For a Laravel response declared as `RegisterResponse`, runtime payload values such
as `data = null` do not change response identity. Identity remains established by
the response declaration and contract; nullability is semantic state on the contract.

## Remaining boundary

`ResolvedField.nullable`, `FieldResolutionMeta`, and the older semantic resource-field
pipeline still contain primitive semantic carriers. They are the next migration target.
They must be migrated only after tracing all consumers, rather than introducing a
second compatibility vocabulary.
