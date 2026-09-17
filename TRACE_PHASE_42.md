# RouteSync Phase 42 — Laravel AST Upstream Trace

## Target trace: ecommerce-shop `POST /register`

```text
routes/api.php
  Route::post('/register', [AuthController::class, 'register'])
        │
        ▼
Laravel Route AST
  RouteDeclarationAst
    method: post
    targetMethods: [post]
    path: RoutePathLiteralAst('/register')
    target: controller_action
      controller: AuthController
      action: register
        │
        ▼
Controller source
  #[Response(RegisterResponse::class)]
  public function register(RegisterRequest $request) { ... }
        │
        ▼
Controller AST
  ControllerDeclarationAst
    className: AuthController
    methods[]
      ControllerMethodAst
        name: register
        parameters[]
          { type: RegisterRequest, name: $request }
        responseAttribute
          { className: RegisterResponse, collection: false }
        returns[]
          nested_array
            success -> boolean(true)
            message -> string(...)
            data -> null
        │
        ▼
Semantic resolution boundary
  RegisterRequest
  RegisterResponse
  runtime response payload
        │
        ▼
Route domain / Manifest / IR
        │
        ▼
Pure lowerers
        │
        ▼
Generated contract
```

## Phase 42 fixes

1. `#` is now tokenized as an attribute marker when followed by `[`, instead of being discarded as a comment.
2. Added `ControllerDeclarationAst`, `ControllerMethodAst`, `ControllerParameterAst`, `ResponseAttributeAst`, and `ReturnStatementAst`.
3. Added controller method parsing upstream of `ControllerScanner`.
4. Controller methods now carry the explicit `Response(...)` attribute and parsed return expressions as AST data.
5. `ControllerScanner` consumes controller AST methods instead of rediscovering `function` declarations from raw tokens.
6. Route AST no longer exposes raw string collections for method expansion, path, prefix, or middleware. These are branded syntax atoms / closed method unions.
7. Fixed controller route target parsing for `[Controller::class, 'action']`.
8. `RouteScanner` consumes the route AST prefix array directly.

## Remaining semantic-boundary work

The AST is intentionally syntax-level. It must not leak into domain/IR. The next boundary should resolve:

```text
ResponseAttributeAst + ReturnStatementAst
          ↓
ControllerResponseContract
          ↓
ResponseDescriptor
```

For `register`, this resolver must preserve both facts:

- identity: `RegisterResponse`
- runtime payload: `{ success: boolean, message: string, data: null }`

The runtime payload must not replace the explicit response identity. It should become a resolved semantic payload attached to the response contract, so downstream passes never re-scan PHP tokens and never infer a response from a model fallback.

## Known remaining smells

- `RouteScanner` still contains controller-map lookup and synthetic closure/controller fallback branches.
- `routePathParser.ts` still derives `resourceName` from path segments.
- `types/domain/routeEntityDefinition.ts` still contains legacy route vocabulary and optional route fields.
- `classifyRoute(ParsedRoute)` still represents a post-scanner classification boundary and should eventually disappear when the scanner emits the complete route ADT.
- `responseDtoReader.ts` still maps unknown PHP types to `UNKNOWN`; this should become an explicit semantic type family rather than an unstructured fallback.

## Validation

- TypeScript syntax/transpile validation: 0 diagnostics across 1217 `.ts` files.
- Direct TypeScript compilation of the Laravel lexer/controller/route AST entrypoints: 0 diagnostics.
- Runtime AST smoke test verified `AuthController::register` produces the expected controller/action, `RegisterRequest`, `RegisterResponse`, and three return payload entries.
- Runtime route AST smoke test verified `POST /register` and `Route::match(['get', 'post'], ...)` produce closed target/action data.
