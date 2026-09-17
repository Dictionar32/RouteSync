# Phase 88 — ecommerce_shop Upstream Semantic Trace

## Ground truth

The trace uses the real `ecommerce_shop` Laravel source, not a synthetic manifest fixture.

### `register.post`

```text
routes/api.php
  -> Route::post('/register', [AuthController::class, 'register'])
  -> AuthController::register()
  -> #[Response(RegisterResponse::class)]
  -> app/Http/DTOs/RegisterResponse.php
  -> { success: bool, message: string, data: mixed }
```

The previous `routesync.manifest.json` classified this route as `model: RegisterResponse` through a legacy fallback. That is not the Laravel source identity. The explicit `Response` attribute is the origin fact.

## Resource flow

```text
Laravel Resource PHP
  -> PHP AST
  -> ResourceFieldExpression
  -> ModelSymbolTable
  -> ResolvedPropertyBinding
  -> ResourceFieldDescriptor.semanticType
  -> SemanticTypeResolver
  -> lowerers
```

Real resources exercised by `ecommerce_shop` include `OrderResource`, `OrderDetailResource`, `PaymentResource`, and `ProdukItemResource`. Their fields use property access, relations, `whenLoaded`, nested arrays, ternaries, literals, and collection resources.

## Trace finding

`ResolvedPropertyBinding` was still porous:

```text
ModelSymbol
  -> type: string
  -> nullable: boolean
  -> cast?: string
  -> propertyAccessBinder re-classifies the string
```

This violated the intended dataflow because the model scanner already owns the semantic type. A downstream binder should not rediscover it.

## Phase 88 fix

`ResolvedPropertyBinding` is now a closed carrier:

```ts
type ResolvedPropertyBinding =
  | { kind: 'column'; source: ParsedColumn; semanticType: SemanticType }
  | { kind: 'accessor'; source: ParsedAccessor; semanticType: SemanticType }
  | { kind: 'relation'; source: ParsedRelation; semanticType: SemanticType }
```

`OriginModelSymbol.resolveProperty()` now passes through `ParsedColumn.semanticType` and `ParsedAccessor.semanticType`. Relations are converted once to `ReferenceType` or `ReadonlyCollectionType(ReferenceType)` at the model boundary.

`propertyAccessBinder` consumes that semantic carrier directly. Nullsafe access adds `NullableType` instead of maintaining a second nullable flag. Unresolved model properties produce `ErrorType`, not a fabricated string type.

## Remaining debt

`ResourceFieldDescriptor` still exposes the legacy `nullable: boolean` field for compatibility. It is now derivable from `semanticType` and should be removed in the next interface pass after all consumers migrate.

`ResourceModelResolver` still performs resource-to-model classification using controller dataflow, relation propagation, naming convention, and structural matching. This is an origin-boundary classification and must emit a closed `ResourceModelBinding`; it must not leak its heuristics downstream.

## Decision

The next interface bottleneck is `ResourceFieldDescriptor` itself, followed by `ResourceModelBinding`. The desired endpoint remains:

```text
Laravel AST
  -> Verified ADT
  -> Semantic ADT
  -> Bound AST
  -> RouteSync IR
  -> Pure Lowerers
```

No downstream regex, string type inference, shape probing, or fallback classification.
