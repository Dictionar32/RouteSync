# RouteSync Phase 87.47 - Upstream High Model + Laravel Response ADT

## Goal

Move the semantic boundary upward:

```text
Laravel source AST
  -> verified Laravel ADT
  -> high-level domain contract
  -> RouteSync IR
  -> lowerers
  -> TypeScript/Zod primitives
```

The model contract is the semantic carrier. TypeScript primitives are output details, not the model itself.

## Ecommerce-shop trace

The regression source is the Laravel `RegisterResponse` DTO referenced by the controller response attribute.

```text
AuthController::register
  -> Response(RegisterResponse::class)
  -> DTO source resolution
  -> ResponseDtoDeclarationAst
  -> ResponseContract
  -> Route response descriptor
  -> IR/lowerer
```

The previous manifest trace correctly established `RegisterResponse` as the response identity, but represented `data` as `unknown | null`. The runtime `data = null` was not allowed to redefine the DTO identity. This phase keeps that principle and makes the upstream contract explicit.

## Changes

### 1. High-level response ADT

`types/domain/responseContracts.ts` now carries:

- typed `ResponseTypeName`
- typed `ResponseFieldName`
- explicit nullability ADT
- closed response-value meaning ADT
- ordered response fields

No `Record<string, ...>` is used by the new contract.

### 2. DTO scanner -> contract boundary

`responseDtoReader.ts` parses the Laravel DTO AST once and emits both:

- legacy compatibility fields for the existing descriptor path
- the new high-level `ResponseContractField[]` source of truth

`mixed` is represented as an explicit unresolved declaration, never as an unstructured `unknown` in the new contract.

### 3. No silent missing-DTO fallback

`responseAttributeScanner.ts` no longer converts a missing response DTO into an empty response shape. If the explicit Laravel response attribute resolves to a class whose source file is absent, the origin boundary fails immediately with a boundary violation.

This prevents:

```text
missing source -> [] -> downstream guesses
```

and enforces:

```text
explicit response identity -> source resolution -> verified contract
```

### 4. Legacy semantic ModelNode removed as a porous record bag

`semantic/modelNodes.ts` now uses the existing high-level `ParsedModel` domain ADT and an explicit `ModelAssignmentBinding[]` state. The previous semantic model contained free-form `Record<string, ...>` bags for fields, casts, relations, accessors, and assignments.

`SymbolTable` builds O(1) indexes from the typed model arrays. Downstream lookup does not require a free-form model bag.

### 5. Assignment dataflow

Model-local assignments are now explicit bindings:

```text
ModelNode
  -> assignments[]
       -> VariableName
       -> FieldNode
       -> SemanticResolution
```

The variable resolver searches the verified binding collection instead of indexing an arbitrary object by string.

## Remaining intentional compatibility boundary

`InlineResponseDescriptor.fields` still exists because older generators consume `ResourceFieldDescriptor[]`. It is a compatibility representation, not the new semantic source of truth.

The next cleanup should migrate the contract lowerers/generators to `semanticContract.fields` and then delete the compatibility field and its primitive `UNKNOWN` conversion path.

## Validation

Targeted TypeScript diagnostics for the changed files were checked with:

```bash
npx tsc --noEmit -p tsconfig.phase87.33.narrow.json
```

No diagnostics were emitted for the Phase 87.47 changed files. The repository still has unrelated pre-existing baseline TypeScript diagnostics, so this phase does not claim repository-wide type-check cleanliness.

## Regression expectation

For `RegisterResponse`:

```text
success -> boolean_flag
message -> textual
data    -> unresolved_declaration(mixed_declaration), nullable
```

The important invariant is that `data = null` in the controller does not erase the DTO contract. Runtime evidence remains trace/provenance, while the declared DTO remains the response identity.
