# RouteSync Phase 43 — Laravel DTO AST Origin Boundary

## Concrete ecommerce-shop trace

The target case is `AuthController::register`:

```php
#[Response(RegisterResponse::class)]
public function register(RegisterRequest $request)
{
    return response()->json([
        'success' => true,
        'message' => 'Register berhasil. Silakan login.',
        'data' => null,
    ]);
}
```

The response DTO is:

```php
class RegisterResponse
{
    public bool $success;
    public string $message;
    public mixed $data;
}
```

## Before Phase 43

`responseDtoReader.ts` token-scanned `public <type> $name` directly and converted the raw PHP type string to `PrimitiveKind`. This bypassed the Laravel AST boundary and allowed a second interpretation of PHP syntax inside a semantic scanner.

## Phase 43 boundary

```text
PHP source
  -> tokenizer
  -> ResponseDtoDeclarationAst
  -> semantic response descriptor
  -> ControllerActionInfo
  -> Route domain
  -> Manifest / IR
  -> lowerers
  -> emitter
```

New syntax AST:

- `PhpPropertyTypeAst`
  - `primitive`
  - `mixed`
  - `named`
  - each carries `nullable`
- `ResponseDtoPropertyAst`
- `ResponseDtoDeclarationAst`

`responseDtoReader.ts` now consumes `ResponseDtoDeclarationAst` rather than manually scanning token positions.

## Strong-representation rule

The AST layer owns PHP syntax facts. The semantic reader owns the conversion from AST vocabulary to domain vocabulary. Downstream code does not receive PHP token patterns for DTO properties.

`mixed` becomes the explicit semantic `UNKNOWN` primitive with `nullable=true`. This is intentional semantic information, not a fabricated concrete type.

## Remaining architectural work

1. Replace `ControllerMethodAst.responseAttribute?:` with an explicit `AbsentResponseAttribute | DeclaredResponseAttribute` ADT.
2. Replace controller parameter `type/name` raw identifiers with typed syntax atoms.
3. Introduce a single `ControllerActionContract` origin resolver combining request, declared response, runtime return shape, errors, and provenance.
4. Remove response/action token rescanning from `actionScanner.ts` once the controller semantic resolver owns those facts.
5. Remove route resource-name derivation from path parsing and make resource identity explicit at the route semantic boundary.
6. Collapse duplicate `ParsedRoute`, `RouteDef`, and `RouteDefinition` only after consumer tracing.

## Validation

- TypeScript parser syntax validation: 0 diagnostics across the project.
- No full build claimed because this extracted Phase 42 workspace has no installed project dependencies and no package-level `tsconfig.json`.
