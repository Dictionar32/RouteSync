# Interface Trace Audit Phase 55

## Scope
Preserve Laravel response DTO property semantics at the AST-to-domain boundary.

## Fixed
- `mixed` nullability is taken from the PHP type syntax instead of being forced to `true`.
- Named DTO property types no longer throw during semantic extraction.
- Named types become first-class `ReferenceType(namespace, name)` nodes.
- `mixed` becomes `PrimitiveType(MIXED)` and remains distinct from unresolved `UNKNOWN`.
- Nullable named and primitive types are represented by `NullableType`.
- Explicit `Response(RegisterResponse)` resolution now builds its semantic contract from the preserved semantic properties rather than reconstructing them from the legacy primitive-only descriptor.

## Dataflow

Laravel PHP
→ Response DTO syntax AST (`primitive | mixed | named`)
→ semantic property (`PrimitiveType | ReferenceType | NullableType`)
→ explicit response semantic contract
→ response derivation
→ downstream lowering

No model lookup is introduced in this pass.

## Known compatibility boundary
`ResourceFieldDescriptor.semanticType` remains a legacy `PrimitiveKind` field for non-response resource scanning. Named response DTO semantics are therefore carried by `ResponseSemanticContract.properties`, which is the authoritative explicit-response path. A future pass should remove this remaining primitive-only field and make `ResourceFieldDescriptor` itself semantic-type based.

## Verification limitation
The ZIP snapshot has no `node_modules`, so the full Vitest/TypeScript build was not executed in this environment. The regression tests were added, but they are not claimed as runtime-green here.
