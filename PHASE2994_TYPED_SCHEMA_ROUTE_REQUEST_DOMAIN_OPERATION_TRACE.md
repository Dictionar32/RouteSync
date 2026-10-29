# Phase 2994 — Typed Schema Route-Request Domain Operation Trace

## Scope
Continue from Phase 2993 without claiming full runtime closure. This phase makes the upstream schema judgment own a domain operation that projects the already-closed schema into route-request evidence, preserving source identity, derivation origin, canonical schema payload, and inline validation entries together.

## Runtime trace: schema → route

```text
PHP controller method body
  → controllerBodySemanticJudgmentAuthority.judge
  → ControllerBodySemanticJudgment.inlineSchemaEvidence + validationEntries
  → controllerActionSchemaSemanticJudgmentAuthority.judge
  → ControllerActionSchemaSemanticJudgment
       ├─ sourceIdentity
       ├─ derivation.kind + derivation.schema
       ├─ inlineValidationEntries
       └─ forRouteRequest()
            → ControllerActionSchemaRouteRequestEvidence
  → controllerActionContractOperations.resolveControllerActionContract
       → schema: routeRequestSchemaEvidence.schema
  → LaravelControllerActionSemanticJudgmentPublication
       → semantic.schema from the same judgment's forRouteRequest().schema
       → compatibility projection.schema
  → routeDeclarationComposition
       → target.action.schema
       → RouteBoundaryOptions.schema
       → RouteBoundaryContractFactory.create
       → RouteBoundaryContract.contract
       → RouteSemanticFlow.contract
       → RouteSyncManifest.ast.ast.routeFlows
  → ManifestSerializer preserves request.body.schema
```

The key ownership improvement is that the schema resolver no longer reaches into `derivation.schema` at each consumer. It invokes `forRouteRequest()`, whose result carries the schema and its source/origin/inline-validation provenance as one explicit domain packet.

## Runtime interface policy

The changed upstream authority remains an interface-typed runtime object:

```ts
export const controllerActionSchemaSemanticJudgmentAuthority:
  ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile> = Object.freeze({ ... });
```

This phase does not mechanically rewrite every `export function` in the repository. The next candidates must be selected from reachable runtime exports, given explicit existing interfaces, and migrated without changing unrelated utilities or creating generic abstraction layers.

## ADT operation

`ControllerActionSchemaSemanticJudgment` now exposes `forRouteRequest()` returning `ControllerActionSchemaRouteRequestEvidence<TSourceIdentity>`. This is a domain-specific continuation, not a generic `fold`/`continueWith<Result>` callback. It keeps these facts bound together:
- exact source identity;
- explicit schema origin (`inline_validation_schema`, `form_request_schema`, or combined);
- canonical `RouteSchemaPayload`;
- exact inline validation entries.

## Provenance gap that remains open

The schema payload is traced through `RouteBoundaryOptions.schema` into `RouteBoundaryContract.contract` and then into `RouteSemanticFlow`/`RouteSyncManifest`. However, the *full evidence packet* (`sourceIdentity`, `schemaOrigin`, and `inlineValidationEntries`) is not yet carried as a first-class field all the way through `RouteBoundaryContract` and serialized manifest. The compatibility route boundary currently retains the schema payload but drops the extra provenance packet. Do not claim full field-by-field provenance closure until that boundary is evolved using an existing upstream contract or a proven necessary extension and a Laravel fixture asserts conservation.

The controller-invocation CLI manifest and route manifest are separate outputs; CLI invocation-manifest completion alone does not prove route schema propagation. Keep both traces distinct.

## Laravel semantics checked

Laravel routing maps route declarations to controller actions; request input can be supplied through injected `Illuminate\\Http\\Request`; validation may be expressed inline or through Form Request classes. RouteSync must retain which source produced schema evidence rather than treating all request schemas as interchangeable. Official docs: [Routing](https://laravel.com/framework/docs/routing), [Controllers](https://laravel.com/framework/docs/13.x/controllers), [Validation](https://laravel.com/framework/docs/validation/latest), [HTTP Requests](https://laravel.com/framework/docs/requests).

## Verification limits

The Phase 2994 audit script checks the interface contract, runtime authority, call-site consumption, public type exports, and known route-manifest provenance boundary. TypeScript files are syntax-transpiled with the globally available TypeScript compiler. This is not a repository-wide typecheck, unit-test pass, or end-to-end Laravel scan. Full `tsc` and Vitest remain unverified in this environment because the installed workspace lacks its complete dependency set.
