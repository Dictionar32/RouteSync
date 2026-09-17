# RouteSync Phase 45 — Controller Body AST / High-Level Upstream Contract

## Objective
Close the remaining semantic bypass found in Phase 44: `actionScanner` was already consuming `ControllerActionContract` for identity/request/response, but validation and error semantics still re-scanned `ControllerMethodAst.bodyTokens`.

## Change
The controller parser now creates a typed `ControllerBodyAst` upstream:

```text
ControllerMethodAst
  ├─ parameters
  ├─ responseAttribute
  ├─ returns
  └─ body: ControllerBodyAst
       ├─ validations: InlineValidationAst[]
       └─ errors: ControllerErrorAst[]
```

`bodyTokens` was removed from `ControllerMethodAst`. The token sequence is now an implementation detail of the parser, not semantic input to downstream scanners.

## New dataflow
```text
Laravel PHP
  ↓
Tokenizer
  ↓
Laravel AST
  ├─ RouteDeclarationAst
  ├─ ControllerDeclarationAst
  │    └─ ControllerMethodAst
  │         ├─ PhpParameterTypeAst
  │         ├─ ResponseAttributeAst
  │         ├─ ReturnStatementAst
  │         └─ ControllerBodyAst
  └─ ResponseDtoDeclarationAst
  ↓
ControllerActionContract
  ├─ identity
  ├─ request ADT
  ├─ response descriptor
  ├─ runtime return ADT
  ├─ body resolution
  └─ schema
  ↓
ScannedControllerActionDescriptor
  ↓
Route / Manifest / IR
```

## Data-free boundary result
`actionScanner.ts` no longer receives source text and no longer traverses controller tokens. It consumes the resolved contract.

The previous fake request type `typeName: "nullable"` was also removed. Nullable parameters remain the typed `PhpParameterTypeAst` ADT.

## Ecommerce-shop example
For:

```php
#[Response(RegisterResponse::class)]
public function register(RegisterRequest $request)
{
    User::create([...]);

    return response()->json([
        'success' => true,
        'message' => 'Register berhasil. Silakan login.',
        'data' => null,
    ]);
}
```

and:

```php
class RegisterResponse
{
    public bool $success;
    public string $message;
    public mixed $data;
}
```

the intended semantic flow is now:

```text
RouteDeclarationAst
    ↓
AuthController.register
    ↓
ControllerActionContract
    ├─ request = FormRequest(RegisterRequest)
    ├─ response = RegisterResponse(single)
    ├─ runtimeReturn = nested array expression
    ├─ body.validations = []
    └─ body.errors = []
    ↓
Manifest/IR
```

The DTO fields remain an upstream `ResponseDtoDeclarationAst`, then become the response semantic contract. The runtime `data = null` is represented by the return AST, not rediscovered downstream.

## Remaining architectural violations
This phase intentionally does not claim the entire compiler is free of untyped data. The next concrete boundaries are:

1. `PhpAstValue` still contains raw string payloads for some expression kinds. Replace these with explicit expression ADTs (`Identifier`, `Variable`, `MethodCall`, `StaticCall`, `PropertyAccess`, `Array`, `Null`, etc.).
2. `responseAttributeScanner` still returns an optional class-file resolution and uses raw string trace entries. Replace with `ResponseClassResolution = resolved | unresolved` and typed provenance.
3. `resourceDataflowAggregator` still uses `Map<string, string>` and heuristic winner selection. Replace with typed `ResourceBinding` values and resolve ambiguity at origin.
4. `routePathParser` still derives resource identity from path strings. Resource identity should originate from route semantic AST/resolution, not be reconstructed downstream.
5. `routeEmitter` still has free route target strings and hardcoded action lists. It should consume a complete route contract.
6. `shapeExtractor`, `propertyProcessor`, `fieldExtractors`, and `resourceTypeDeriver` still contain `Record<string, unknown>` casts. These are later semantic-boundary cleanup targets.
7. Duplicate route models (`ParsedRoute`, `RouteDef`, `RouteDefinition`, endpoint/IR representations) remain and require consumer tracing before collapse.

## Rule for the next phases
Do not mechanically delete `?`, `??`, `Record<string, unknown>`, or `Map<string, string>`. Each one is a symptom. First raise the upstream model so the value has a legal ADT state, then remove the defensive/free-data representation.

## Verification
TypeScript syntax/transpile validation over all `packages/core/src` files: 832 files, 0 syntax diagnostics.
A full project typecheck is not claimed because the extracted workspace has pre-existing dependency/type-tree errors unrelated to this phase.
