# RouteSync Interface Trace Audit - Phase 54

## Scope
Upstream ADT/dataflow review against the Laravel `ecommerce-shop` response path.

## Confirmed flow

`Response(RegisterResponse)` -> resolved response class -> DTO property AST -> semantic fields -> `InlineResponseDescriptor` -> downstream contract.

The explicit response attribute is authoritative. Runtime values must not redefine response identity.

## Fix in this phase

`ResourceResponseDescriptor.create()` and `ModelResponseDescriptor.create()` no longer manufacture `UnknownResource` or `UnknownModel` identities. Resource/model identity is now required at the factory boundary. The default `shape = 'single'` remains because it is a valid domain default, unlike a fabricated entity identity.

## Remaining upstream work

1. `PhpPropertyTypeAst.named` must become a first-class semantic reference rather than throwing in `responseDtoReader`.
2. `InlineResponseDescriptor` needs an explicit-origin construction path so declared responses cannot exist without origin and semantic contract.
3. Canonical PHP AST still carries `originalCode`; semantic AST should retain structured meaning and source provenance, not arbitrary source text.
4. Legacy `ResourceFieldDescriptor.semanticType: PrimitiveKind` is too narrow for reference/object/collection semantic types and should migrate toward `ResolvedSemanticType`.
5. Legacy response metadata still has `kind: 'unknown'` and free-form `Record<string, ...>` fields. These should be replaced by closed ADTs at the boundary.

## Invariant

No downstream stage should infer an identity that was absent upstream. Missing required identity is a boundary error, not a reason to invent a sentinel value.
