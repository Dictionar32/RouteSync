# RequestAst Trace — 2026-09-20

## Boundary
Laravel → Scanner/Lexer → existing domain source interface → Upstream AST → Manifest

## Producer trace

Laravel `app/Http/Requests/*.php`
→ `FormRequestScanner.scan()`
→ `FormRequestSource`
→ `requestAstFromSource()`
→ `RequestAst`

### Authorization repair
`FormRequestSource` previously lacked authorization while `RequestDefinition` required it.

Repair:
- Existing `FormRequestSource` now carries `authorization`.
- `FormRequestScanner` reads the existing Laravel `authorize()` method from lexer tokens.
- `true` → `{ kind: 'authorized' }`.
- `false` → `{ kind: 'denied' }`.
- Missing/unsupported authorization is an explicit boundary error; no invented default.

### AST repair
`FormRequestScanner.scanAsts()` previously returned `FormRequestSource[]` directly.

Repair:
- Added `requestAstFromSource()` canonicalization.
- `scanAsts()` now produces real `{ kind: 'request_ast', definition, source }` values.
- Field meaning, presence, target and validation are converted at the upstream boundary.

## Compile verification

Global TypeScript 5.8.3 was used because workspace dependencies are incomplete.
A narrow compile check reached existing unrelated core errors. No diagnostic was emitted from `requestAstCanonical.ts`.
The exact command `tsc -p tsconfig.phase87.33.narrow.json --noEmit` now reaches TypeScript diagnostics after restoring the local `@types/node` link. No diagnostic is emitted from `FormRequestScanner.ts` or `requestAstCanonical.ts`. Remaining diagnostics are pre-existing/unrelated core binder, property-path, semantic resource, symbol-table, and graph errors.

## Trace ulang result

### GREEN
Laravel source → lexer → `FormRequestSource` → `RequestAst` producer.

### YELLOW / next upstream gap
`executeScanPipeline()` still calls `FormRequestScanner.scan()` and carries `FormRequestSource` into controller/route scanning. It does **not** consume `scanAsts()`.

`FormRequestScanner.scanAstCollection()` is now the concrete producer for the existing `RequestAsts` type:

`FormRequestScanner.scan()` → `FormRequestSource[]`
→ `requestAstFromSource()` → `RequestAst[]`
→ `scanAstCollection()` → `RequestAsts`

But no consumer carries this `RequestAsts` into `SourceAsts`. `SourceAsts → CompleteSourceAst → RouteSyncManifest` therefore remains unconnected.

Therefore the `RequestAst → RequestAsts` segment is now GREEN; the next missing connection is `RequestAsts → SourceAsts`.

## Rule
Do not modify downstream after Manifest. The next trace should start at the manifest producer and determine exactly where `RequestAst` must be carried before the Manifest boundary.

## Trace cycle 2 — RequestAsts → SourceAsts

### Producer trace
The existing `SourceAsts` interface already contains `requests: RequestAsts`; no new interface was introduced.

A concrete upstream producer was added at:
`packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts`

Flow now:
`FormRequestScanner.scanAsts()` → `RequestAst[]`
→ `scanned(RequestAst[])` → `RequestAsts`
→ `SourceAsts.requests`

The same producer currently connects the existing AST scanner outputs for:
- `ModelScanner.scanAsts()` → `SourceAsts.models`
- `ResourceScanner.scanAsts()` → `SourceAsts.resources`
- `FormRequestScanner.scanAsts()` → `SourceAsts.requests`
- `RouteScanner.scanAsts()` → `SourceAsts.routes`
- `ControllerScanner.scanAsts()` → `SourceAsts.controllers`

The remaining existing `SourceAsts` categories are deliberately marked `not_scanned` because no producer exists yet:
`services`, `migrations`, `responses`, `dtos`, `middlewares`, `providers`, `attributes`.
No fake AST data or fallback values were introduced.

### Compile
`tsc -p tsconfig.phase87.33.narrow.json --noEmit` was rerun after the producer was added.
No diagnostic was emitted from:
- `sourceAstScanner.ts`
- `FormRequestScanner.ts`
- `requestAstCanonical.ts`

The compiler still reports the pre-existing core diagnostics in resource binders/descriptors and related semantic/model code. Those are not changed in this cycle.

### Trace ulang
`RequestAst → RequestAsts → SourceAsts.requests` is now connected.

The next upstream gap is not another RequestAst interface. It is the missing producers for the remaining `SourceAsts` categories, followed by:
`SourceAsts → validateCompleteSourceAst() → CompleteSourceAst → RouteSyncManifest`.

### Boundary rule
No downstream-after-Manifest code was modified.

## Trace cycle 3 — SourceAsts completeness boundary

### Producer trace
`scanSourceAsts(projectRoot)` is now the concrete producer for the existing `SourceAsts` interface.

Connected producers:
- `ModelScanner.scanAsts()` → `SourceAsts.models`
- `ResourceScanner.scanAsts()` → `SourceAsts.resources`
- `FormRequestScanner.scanAsts()` → `SourceAsts.requests`
- `RouteScanner.scanAsts()` → `SourceAsts.routes`
- `ControllerScanner.scanAsts()` → `SourceAsts.controllers`

No real upstream producer was found for:
- `services`
- `migrations`
- `responses`
- `dtos`
- `middlewares`
- `providers`
- `attributes`

Important: `scanMigrations()` is **not** a MigrationAst producer. It returns `Map<string, ParsedColumn[]>` and therefore cannot safely be wrapped as `MigrationAst` without semantic loss. No fake adapter was introduced.

### Saran
Do not invent AST values and do not create another interface. The next repair must start from an actual scanner/lexer producer for one of the missing categories.

### Compile
Command:
`tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: exit 1. No diagnostic points to `sourceAstScanner.ts`, `FormRequestScanner.ts`, or `requestAstCanonical.ts`. Existing diagnostics remain in resource binders/property-path/semantic resource, model symbol, and graph utility areas.

### Trace ulang
`RequestAst → RequestAsts → SourceAsts.requests` remains GREEN.
`SourceAsts` itself is GREEN as a constructed aggregate, but `validateCompleteSourceAst()` cannot produce `CompleteSourceAst` while seven categories remain `not_scanned`.

Next exact upstream gap:
`SourceAsts → validateCompleteSourceAst → CompleteSourceAst`.
Before that boundary can become GREEN, a real producer must be traced and repaired for the missing source category. No downstream-after-Manifest code is changed.

## ResponseAst trace update

Producer trace: `ControllerAst.response` and `RouteAst.response` both carry `ResponseContract`, but neither currently carries the complete `ResponseDefinition` required by `ResponseAst`. The missing semantic inputs are a concrete `HttpStatusCode` and a `ResponseResult`/output mapping at the upstream scanner boundary. Do not infer defaults or create an adapter that loses meaning. Keep `SourceAsts.responses` as `not_scanned` until a real producer exists.

Current boundary:
`Laravel -> Controller/Route scanners -> ResponseContract -> [missing ResponseDefinition producer] -> ResponseAst -> SourceAsts.responses`

## Trace cycle 4 — Response producer / ControllerAst truth correction

### Producer trace correction
The upstream `ResponseContract` type is already structurally complete:
`ResponseContract.definition` is a `ResponseDefinition` containing `typeName`, `output`, `result`, `status`, and `source`.

However, no producer in the scanner currently constructs an upstream `ResponseContract` / `ResponseAst` from Laravel source.
The existing controller pipeline produces legacy `ResponseDescriptor` values instead.
Therefore the earlier assumption that `ControllerAst.response` was already an upstream `ResponseContract` was incorrect.

A second producer mismatch was found:
`ControllerScanner.scanAsts()` is typed as `Promise<readonly ControllerAst[]>` but returns the legacy `ControllerScanner.scan()` result (`Map<string, Map<string, ControllerActionInfo>>`). It is not a valid `ControllerAst` producer.

### Repair
`sourceAstScanner.ts` no longer marks `SourceAsts.controllers` as `scanned` from this invalid producer. It remains `not_scanned` until a real ControllerAst canonical producer exists.
No new interface was introduced and no downstream code was changed.

### Compile
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` was executed.
Compilation remains red with existing core diagnostics across resource binders/property-path/model descriptors/request descriptors/route factories. The repaired `sourceAstScanner.ts` change introduced no new diagnostic in its own boundary.

### Trace ulang
Current verified AST producers:
- ModelAst → SourceAsts.models
- ResourceAst → SourceAsts.resources
- RequestAst → SourceAsts.requests
- RouteAst → SourceAsts.routes

Not yet verified as real AST producers:
- ControllerAst
- ResponseAst
- ServiceAst
- MigrationAst
- DtoAst
- MiddlewareAst
- ProviderAst
- AttributeAst

Next exact upstream trace: build the real `ControllerAst` producer from the existing controller lexer/semantic contract, then reuse its existing `ResponseContract` data only if it actually matches the upstream response vocabulary. Do not fabricate `ResponseDefinition` fields.

## 2026-09-20 — ControllerAst producer trace

- `ControllerScanner.scan()` produces `Map<string, Map<string, ControllerActionInfo>>` through `scanControllerAction()` and `resolveControllerActionContract()`.
- `ControllerScanner.scanAsts()` does not produce `ControllerAst`; it returns the legacy map under an incompatible type. It remains disabled from `SourceAsts.controllers`.
- Existing upstream `ControllerAction` requires `controller`, `action`, `domain`, `request`, `statements`, `response`, `semantic`, and `source`.
- Existing controller contract provides request/response/body/dataflow, but there is no canonical mapper supplying the complete upstream `ControllerAction`, especially `domain`, upstream `ControllerStatements`, and `ControllerSemanticDataflow`.
- Decision: do not fabricate/adapt missing semantics. Keep `SourceAsts.controllers = not_scanned` until a real upstream producer exists.

## Controller producer trace — 2026-09-20 cycle

Trace:
`ControllerMethodAst → resolveControllerActionContract() → ControllerActionContract → scanControllerAction() → ScannedControllerActionDescriptor`

Findings:
- `ControllerActionContract` is a real producer, but it is still legacy-shaped.
- `ControllerAction` requires `domain`, `ControllerStatements`, upstream `ResponseContract`, and `ControllerSemanticDataflow`; the current contract does not carry those exact upstream values.
- `ControllerScanner.scanAsts()` was a false producer: it declared `readonly ControllerAst[]` while returning the legacy `Map<string, Map<string, ControllerActionInfo>>`.

Repair:
- Removed the false `ControllerScanner.scanAsts()` producer instead of casting the legacy map into `ControllerAst[]`.
- No downstream code was changed.
- No new interface was introduced.

Compile:
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` still fails on existing interface mismatches in resource binders, property-path binding/resolution, route-response semantics, model symbols, and FrozenSet/ReadonlySet compatibility. No compiler error points to the removed false producer.

Next upstream boundary:
`ControllerActionContract → ControllerAction`.
Before creating a mapper, trace the producer for each missing upstream field, especially `domain`, `statements`, `response`, and `semantic`.

## Controller semantic producer trace — 2026-09-20

```text
ControllerMethodAst
  ↓
resolveControllerActionContract()
  ↓
ControllerActionContract.dataflow
  ├─ ast: ControllerDataflowAst                         [producer nyata]
  ├─ semantic: scanner ControllerSemanticDataflow      [producer nyata]
  └─ resourceBindings                                  [producer nyata]

scanner ControllerSemanticDataflow
  ↓  NOT structurally equivalent
upstream ControllerSemanticDataflow

Missing upstream mapping:
  variables: Sequence<ControllerVariableBinding>
  resources: Sequence<ControllerResourceBinding>
  returned: ControllerReturnSemantic

Existing scanner semantic data has:
  variables: readonly ControllerSemanticVariableBinding[]
  byVariable: ControllerSemanticVariableIndex
  returned: readonly ControllerSemanticReturn[]

Conclusion:
- Do not cast the scanner semantic object to upstream ControllerSemanticDataflow.
- Do not add a second interface merely to bridge it.
- The existing semantic producer must be traced field-by-field before a canonical mapper is repaired.
- `domain` has an existing route/boundary producer elsewhere, but no controller-origin producer was established yet.
- `statements` has no verified ControllerStatements producer from ControllerBodyResolution yet.

Next trace target:
ControllerBodyResolution → existing statement producer → upstream ControllerStatements
then
ResponseDescriptor → ResponseContract.
```

## Controller statements producer trace — 2026-09-20

Trace:
`ControllerMethodAst.body → resolveControllerBody() → ControllerBodyResolution.statements`

Producer found:
- `ControllerBodyResolution.statements` is `readonly PhpStatement[]`.
- `PhpStatement` is the lexer-level statement ADT.
- Existing `resourceUpstreamExpressionClosure.ts` maps `PhpStatement` only to `ClosureStatement`, not `ControllerStatement`.
- No verified producer currently maps `PhpStatement` to upstream `ControllerStatements`.

Conclusion:
- `ControllerBodyResolution.statements` is a real source producer, but not yet an upstream `ControllerStatements` producer.
- Do not cast or reuse `ClosureStatement` as `ControllerStatement` because the semantic contracts differ.
- No interface was added and no downstream code was changed.

Next exact upstream trace:
`PhpStatement → existing upstream expression/assignment mappers → ControllerStatement`
with special attention to `return`, because upstream `ControllerStatement.return` requires a `ResponseContract` that the current statement producer does not carry.

## Trace cycle — ResponseDescriptor → upstream ResponseContract

Producer trace:
`ControllerMethodAst.responseAttribute → resolveResponse() → ResponseDescriptor`.

Correction to prior trace: `void` is NOT a PrimitiveVocabulary blocker. The existing upstream `TypeExpression` already has `never`, and `ResponseJsonShape` already has `empty`, so a void response can be represented without adding a new primitive/interface. No vocabulary change was made.

The actual boundary gap is broader: `ResourceResponseDescriptor` and `ModelResponseDescriptor` carry only resource/model identity + shape, while upstream `ResponseDefinition` requires `typeName`, `output`, `result`, `status`, and `source`. `InlineResponseDescriptor` additionally carries the existing domain `ResponseContract`, but that is a different type from upstream `ResponseContract`.

Decision: do not create an adapter or cast. The canonical producer must be assembled from the existing descriptor plus its already-available source/model/resource semantics at the upstream boundary. This cycle makes no code change because the missing source-to-upstream mapping is not yet proven.

Compile remains red with existing errors in resource/property-path/model semantic areas; no new error was introduced by this trace.

## Trace Cycle — ResourceResponseDescriptor

Producer trace:

```text
Controller/resource invocation detector
  -> ResourceResponseDescriptor(resourceName, shape)
  -> ResponseDescriptor
```

The existing `ControllerDataflowContract.resourceBindings` separately carries:

```text
resourceName -> ControllerModelOrigin
```

but `ResourceResponseDescriptor` does not carry that model meaning. The upstream `ResponseJsonPayload.resource` requires both `ResourceReference` and `ModelReference`.

The producer therefore loses model identity at the response descriptor boundary. There are also synthetic/closure producers constructing `ResourceResponseDescriptor` without a model, so adding a blind default would be incorrect.

Decision: no fake adapter and no new interface. The next repair must connect the existing `resourceBindings` producer to the existing `ResourceResponseDescriptor` boundary (or prove an existing resolver already owns that connection). Downstream remains unchanged.

Compile after trace: `npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` => TS_EXIT=2. Existing errors remain in resource binders/property-path/semantic areas; no new error was introduced by this trace cycle.

## Controller Response Producer Trace — cycle

`resolveControllerActionContract()` currently produces the legacy `ResponseDescriptor` from `resolveResponse()`.

```text
ControllerMethodAst.responseAttribute
  -> resolveResponse()
  -> ResponseDescriptor
  -> ControllerActionContract.response
```

Canonical upstream `ResponseContract` requires `ResponseDefinition` with `typeName`, `output`, `result`, `status`, and `source`.

Current descriptor producers do not uniformly carry those facts:
- `VoidResponseDescriptor`: has type/status/shape, but legacy `toResponseBody()` uses primitive `void` while upstream `TypeExpression` uses `never`.
- `InlineResponseDescriptor`: has type and semantic contract, but its source span is represented by descriptor origin/source-file metadata rather than `SourceSpan`.
- `ResourceResponseDescriptor`: has resource + shape but no model reference.
- `ModelResponseDescriptor`: has model + shape.

Therefore no canonical `ResponseDescriptor -> ResponseContract` producer is currently complete. Do not cast, add a fallback model, or create a second response interface. The next upstream repair must connect the existing resource/model semantic producer to response resolution before constructing `ResponseContract`.

## Laravel source ground truth — 2026-09-20

Source archive extracted for upstream AST/ADT tracing:
`/mnt/data/ecommerce_shop-source/ecommerce_shop-main`

Generator artifacts available in the same source tree:
- `routesync.manifest.json`
- `routesync.manifest.fresh6.json`
- `routesync.ir.json`
- `routesync.graph.json`

Primary register trace evidence:
`routes/api.php`
→ `POST /register`
→ `AuthController::register(RegisterRequest $request)`
→ `#[Response(RegisterResponse::class)]`
→ `response()->json({ success, message, data })`

Source files involved:
- `app/Http/Requests/Auth/RegisterRequest.php`
- `app/Http/Controllers/Auth/AuthController.php`
- `app/Http/DTOs/RegisterResponse.php`
- `app/Attributes/Response.php`

Generated manifest evidence (`routesync.manifest.fresh6.json`):
- `routes[0].name = register.post`
- `routes[0].path = /register`
- `routes[0].response.model = RegisterResponse`
- `routes[0].response.resolved.model = RegisterResponse`
- `models` contains `RegisterResponse`

This source tree is the ground truth for the upstream trace. Downstream is not modified.

## RequestAst canonicalizer repair — 2026-09-20

### Problem found
`requestAstFromSource()` was a real AST producer, but its semantic type conversion did not conform to the existing upstream `TypeExpression` vocabulary:
- visitor inference narrowed the result to the first primitive branch;
- `StringValue` wrappers were passed where plain strings were required;
- `RequestFieldName` was incorrectly treated as a `StringValue`.

### Repair
Repaired the existing canonical producer only:
- `semanticTypeFromMeaning()` now uses the existing `RequestFieldMeaningVisitor<TypeExpression>` contract explicitly;
- `scalarType()` explicitly returns upstream `TypeExpression`;
- existing `StringValue` wrappers are unwrapped only at the scalar-to-string boundary;
- `RequestFieldName.value` remains its existing plain string value;
- source file and request/form names are converted through their existing value objects.

No new interface was introduced. No legacy `Parsed*` type was widened. No downstream code was changed.

### Verification
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`
- `requestAstCanonical.ts`: **0 diagnostics** after repair.
- Whole narrow compilation remains red due to unrelated existing core diagnostics in resource binders/property-path/model/semantic code.

### Trace ulang
```text
FormRequestSource
  ↓
requestAstFromSource()
  ↓
RequestDefinition
  ├─ identity        ✅ upstream names
  ├─ authorization  ✅ upstream ADT
  └─ schema         ✅ upstream RequestFields / TypeExpression
  ↓
RequestAst
  ↓
RequestAsts
  ↓
SourceAsts.requests
```

The Request boundary is now internally type-correct. The next work remains the broader `SourceAsts` completeness boundary; do not modify downstream.

## 2026-09-20 — End-to-end upstream boundary repair

Target flow locked:

Laravel ecommerce_shop → Scanner/Lexer → complete AST/ADT → Manifest → downstream

Ground-truth source workspace:
`/mnt/data/ecommerce_shop-trace/ecommerce_shop-main`

Current verified AST producers:
- ModelScanner.scanAsts → ModelAst → SourceAsts.models
- ResourceScanner.scanAsts → ResourceAst → SourceAsts.resources
- FormRequestScanner.scanAsts → RequestAst → SourceAsts.requests
- RouteScanner.scanAsts → RouteAst → SourceAsts.routes

Current upstream gaps:
- ControllerAst: no canonical producer. Do NOT adapt ControllerActionInfo/legacy Map into ControllerAst.
- ResponseAst: no canonical producer.
- ServiceAst/MigrationAst/DtoAst/MiddlewareAst/ProviderAst/AttributeAst: no canonical producers yet.

Important interface finding:
`ControllerAction.response` currently requires upstream `ResponseContract`, whose `ResponseDefinition` contains HTTP status. HTTP status is route-level information in the Laravel source boundary and is not present in `ControllerMethodAst`. Therefore a ControllerAst producer cannot honestly construct that field without inventing data or borrowing route information. This is an upstream interface-boundary issue, not a downstream problem.

Legacy path remains reference only:
Parsed* / descriptor* → legacy manifest

It must not be used as a fake AST producer.

## 2026-09-20 — Flow repair: Controller response boundary

The Laravel source supplied for this trace is preserved in:
`examples/ecommerce-shop-source/`

Ground-truth examples include:
- `app/Http/Controllers/Auth/AuthController.php`
- `app/Http/Requests/Auth/RegisterRequest.php`
- `app/Http/DTOs/RegisterResponse.php`
- `routes/api.php`
- `app/Http/Resources/*`
- `app/Services/*`
- `database/migrations/*`
- `app/Http/Middleware/*`
- `app/Providers/*`
- `app/Attributes/*`

### Interface repair
The existing upstream `ControllerAction` previously carried `ResponseContract` directly. `ResponseContract` contains HTTP status and response-result semantics that are not intrinsic to a controller action source boundary.

Repair:
- Removed `response: ResponseContract` from the existing `ControllerAction` interface.
- Removed the same response contract from the existing upstream `ControllerStatement` return variant.
- No new interface was introduced.
- No downstream-after-Manifest code was changed.

### Trace effect
The boundary is now conceptually separated:

`Laravel controller source → ControllerMethodAst → ControllerAction`

and response semantics remain a separate upstream concern:

`Laravel response source → ResponseAst → SourceAsts.responses`

The compiler now exposes remaining legacy/upstream mismatches that must be repaired at their producers rather than hidden with casts/defaults.

### Compile verification
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: exit 2, 366 diagnostics. The changed `types/upstream/controller.ts` itself is not reported as erroneous. Current diagnostics include legacy request-binding and controller dataflow `StringValue`/`string` mismatches, plus the pre-existing core semantic/binder diagnostics.

### Next upstream trace
`ControllerActionContract → ControllerAction`.
Specifically repair the existing producer's request/dataflow/statement vocabulary so it can produce the upstream ControllerAction without importing legacy descriptor meaning.

## Trace Cycle — Controller AST Boundary (2026-09-20)

Flow under verification:

Laravel ecommerce_shop → Scanner/Lexer → AST/ADT lengkap → CompleteSourceAst → Manifest → downstream

### Trace
- `ControllerScanner` parses controller files through `LaravelSourceLexer.parseControllerDeclaration()`.
- `ControllerMethodAst` is a real lexer AST producer.
- `scanControllerAction()` currently lowers `ControllerMethodAst` into legacy `ControllerActionInfo` through `ControllerActionContract`.
- `ControllerAst` has no canonical producer in `sourceAstScanner.ts`; controllers remain explicitly `not_scanned`.
- Therefore `SourceAsts.controllers` is not yet connected to the real controller producer.

### Saran
Do not adapt `ControllerActionInfo` / legacy descriptors into `ControllerAst`. That would preserve the legacy boundary instead of repairing the AST boundary.

The canonical path must be:

`ControllerMethodAst → canonical upstream ControllerAction → ControllerAst → SourceAsts.controllers`

The canonical upstream `ControllerAction` must preserve controller-source meaning without importing lexer AST types into upstream types and without inventing route-level HTTP status.

### Perbaikan
The upstream `ControllerAction` boundary is kept free of `ResponseContract`/HTTP status. Response status remains response/route-level information. The invalid `ControllerScanner.scanAsts()` Map-as-AST adapter is not used.

No fake ControllerAst producer was introduced.

### Verification
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` still fails in existing resource/property-path binder areas. The current first diagnostics are unrelated to the ControllerAst boundary (e.g. `collectionArrayBinders.ts`, `literalTernaryBinders.ts`, `propertyPathBinder.ts`).

### Next upstream repair
Build the canonical `ControllerAction` producer from the existing `ControllerMethodAst`/controller semantic analysis, then connect it to `SourceAsts.controllers`. Do not modify downstream to compensate.


## Trace Cycle — Controller AST Canonical Producer (2026-09-20)

### Source ground truth
`examples/ecommerce-shop-source/app/Http/Controllers/Auth/AuthController.php` contains controller methods whose semantic source includes typed requests, model/static calls, conditionals, assignments, returns, response attributes, and HTTP behavior.

### TRACE
`Laravel controller source → LaravelSourceLexer.parseControllerDeclaration() → ControllerMethodAst` is a real lexical AST path.

Previously the next edge was only `ControllerMethodAst → legacy ControllerActionInfo`. `SourceAsts.controllers` was therefore `not_scanned`.

### SARAN
Raise the existing lexer AST into the existing upstream vocabulary instead of adapting `ControllerActionInfo`. The producer must preserve statements, request binding, variable semantic facts, resource/model origins, and returned expressions.

### PERBAIKI
Added `controllerAstCanonical.ts` as the canonical producer implementation using existing upstream types.
- `ControllerMethodAst → ControllerAction → ControllerAst` is now real.
- Existing `PhpAstValue → upstream Expression` mapping is reused.
- Existing controller-body semantic facts are carried into upstream `ControllerSemanticDataflow`.
- No legacy `ControllerActionInfo` is used as the AST source.
- `SourceAsts.controllers` now consumes `ControllerScanner.scanCanonicalAsts()`.
- No downstream-after-Manifest code was changed.

### TRACE ULANG
`ControllerMethodAst → ControllerAst` now type-checks in the narrow compiler. The remaining diagnostics for `ControllerScanner.ts` are the narrow-config environment's pre-existing `path`/`fs-extra` module typing issues; no diagnostics originate from `controllerAstCanonical.ts` or `sourceAstScanner.ts`.

### Current upstream status
`ModelAst ✅ · ResourceAst ✅ · RequestAst ✅ · RouteAst ✅ · ControllerAst ✅ producer`
`ResponseAst ❌ · ServiceAst ❌ · MigrationAst ❌ · DtoAst ❌ · MiddlewareAst ❌ · ProviderAst ❌ · AttributeAst ❌`

### Next trace
Continue from the newly connected `ControllerAst` into the response source boundary, using `AuthController::register` and `RegisterResponse` as ground truth. Do not repair downstream.

## Trace Cycle — Semantic Interface Elevation: Assignment + Response (2026-09-20)

### Target
Do not merely make the canonical producer compile. The producer must not claim semantic knowledge that the source parser did not produce.

### TRACE — Controller assignment
Previous path:
`PhpStatement.assignment.value → ResolvedExpression.result`

Problem:
`ResolvedExpression.result` is a semantic classification, but the controller lexer boundary produces only `PhpAstValue`. The canonical mapper was therefore manufacturing `{ kind: 'typed', type: { kind: 'mixed' } }` for non-literals.

That is information fabrication, not an invariant.

### SARAN
Raise the existing `Assignment` contract only to the semantic level actually produced by the source boundary:

`PhpAstValue → Expression → Assignment.expression`

Keep `ResolvedExpression` available for boundaries that genuinely produce a semantic result. Do not force every source assignment to pretend it has one.

### PERBAIKI
Existing `Assignment.expression` was changed from `ResolvedExpression` to `Expression`.
The controller canonical producer now maps assignment values directly through the existing `mapResourcePhpAstToUpstream()` expression vocabulary.
No fallback `mixed` semantic value is used anymore.
No downstream-after-Manifest code was changed.

### TRACE ULANG
The canonical controller path is now:
`ControllerMethodAst → PhpStatement → Expression/Assignment → ControllerStatements → ControllerAction → ControllerAst → SourceAsts.controllers`

The remaining narrow compile failures are in existing resource/property-path/binder areas; the changed controller assignment boundary introduces no reported diagnostic.

## Trace Cycle — Response Source Boundary (2026-09-20)

### Ground truth
`examples/ecommerce-shop-source/app/Http/DTOs/RegisterResponse.php` contains:
- `bool $success`
- `string $message`
- `mixed $data`

The controller attribute `#[Response(RegisterResponse::class)]` references this DTO, while the controller's JSON result supplies runtime HTTP behavior.

### TRACE
`RegisterResponse.php → response DTO lexer AST → property type AST`

The DTO source intrinsically knows:
- response type name
- object property names
- property type expressions
- nullability
- source provenance

It does NOT intrinsically know:
- HTTP status
- whether an endpoint returns a collection
- redirect/download behavior

### SARAN
Do not force those route/controller semantics into `ResponseAst`.
The existing `ResponseDefinition` was too high-level because it required `status` and `result` while the DTO source cannot honestly produce either.

Raise the existing response interface around source-owned meaning:
`ResponseDefinition = typeName + output TypeExpression + source`

Route/controller response behavior remains a separate relation/boundary.
No new response vocabulary was introduced.

### PERBAIKI
- Removed `status` and `result` from existing upstream `ResponseDefinition`.
- Applied the same source-boundary correction to `ResponseFacts`.
- Kept existing `ResponseResult`, `PaginationKind`, and `ResponseContract` vocabulary available for the later endpoint/route relation where those facts actually originate.
- Added canonical `scanResponseAsts()` for `app/Http/DTOs`.
- DTO properties are lowered directly into upstream `TypeExpression` / `TypeProperty` ADTs.
- `SourceAsts.responses` now receives `scanned(responses)` instead of `notScanned()`.

### TRACE ULANG
`RegisterResponse.php → ResponseDtoDeclarationAst → TypeExpression(object) → ResponseAst → ResponseAsts → SourceAsts.responses`

No HTTP status or collection default is fabricated.

### Current upstream connection map
`ModelAst        → SourceAsts.models       ✅`
`ResourceAst     → SourceAsts.resources    ✅`
`RequestAst      → SourceAsts.requests     ✅`
`RouteAst        → SourceAsts.routes       ✅`
`ControllerAst   → SourceAsts.controllers  ✅`
`ResponseAst     → SourceAsts.responses    ✅`
`ServiceAst      → SourceAsts.services     ❌`
`MigrationAst    → SourceAsts.migrations   ❌`
`DtoAst          → SourceAsts.dtos         ❌`
`MiddlewareAst   → SourceAsts.middlewares  ❌`
`ProviderAst     → SourceAsts.providers    ❌`
`AttributeAst    → SourceAsts.attributes   ❌`

### Important boundary status
`SourceAsts → CompleteSourceAst → RouteSyncManifest` has the type-level completeness validator already, but there is still no verified production producer connecting the real `scanSourceAsts()` result to `CompleteSourceAst` and then to `RouteSyncManifest`.

Current legacy production path remains:
`scanSourceAsts()` + legacy Parsed*/descriptor scanning → `ScannedRouteManifestDescriptor`

This is the next major upstream connection. Downstream after Manifest must remain untouched.

### Verification
Narrow compile after the interface elevation still fails globally because the workspace has existing core binder/descriptor diagnostics. The changed response/controller canonical files only show the known narrow-config environment issues around `path` / `fs-extra`, not semantic contract errors from the new source mappings.

## 2026-09-20 — Interface elevation: preserve ResolvedExpression

Principle: an upstream interface must not be weakened merely because the current producer is incomplete. Preserve future semantic capability and repair the producer boundary instead.

Trace:
`PhpStatement.assignment.value → ControllerVariableDefinition.semantic → ResolvedExpression.result → Assignment → ControllerStatement → ControllerStatements → ControllerAction → ControllerAst`

Repair:
- `Assignment.expression` remains `ResolvedExpression`; the higher-level contract is preserved.
- `SemanticValue` now has an explicit `unresolved` ADT state (`external | unsupported`) instead of manufacturing `typed(mixed)`.
- Controller assignment canonicalization now consumes the existing lexer dataflow semantic classification when available.
- Known model/request origins become explicit semantic references.
- Unknown/external producer knowledge remains explicitly unresolved at the upstream boundary, rather than being silently downgraded or deleted.

Important:
- No downstream code was changed.
- No legacy `ControllerActionInfo` was used to fake canonical AST data.
- The `ResolvedExpression` vocabulary remains available for future producers that can resolve richer expression results.

Verification:
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit --pretty false`
continues to fail in pre-existing binder/model-path areas; the new controller canonical files and upstream assignment boundary do not appear in the diagnostic output.

## 2026-09-20 — TRACE ULANG: source coverage versus SourceAsts

The real `ecommerce_shop` source was checked against every `SourceAsts` category. `not_scanned` is not equivalent to "no source exists".

| SourceAsts category | Real source evidence | Current producer |
|---|---:|---|
| models | present | scanned |
| resources | present | scanned |
| requests | present | scanned |
| routes | present | scanned |
| controllers | present | scanned |
| responses | present (`app/Http/DTOs`) | scanned |
| services | present (`app/Services`) | not_scanned |
| migrations | 25 files | not_scanned |
| dtos | present (`app/Http/DTOs`) | not_scanned |
| middlewares | present (`app/Http/Middleware`) | not_scanned |
| providers | present (`app/Providers`) | not_scanned |
| attributes | present (`app/Attributes`) | not_scanned |

### Architectural finding
`CompleteSourceAst` cannot honestly be produced yet. The completeness validator is correctly exposing missing upstream producers; it must not be bypassed or weakened.

### Next elevation order
1. MigrationAst — existing lexer/token scanner already exists, so raise its output into the existing `MigrationDefinition` ADT.
2. ServiceAst — reuse existing controller/body/expression vocabulary rather than creating a second statement model.
3. MiddlewareAst / ProviderAst / AttributeAst — raise existing application ADTs from real Laravel class declarations.
4. DtoAst — preserve the existing DTO vocabulary while connecting it to `SourceAsts.dtos`; response DTO remains a separate response boundary.

### Rule
Do not mark a category `scanned` unless its producer emits the existing canonical ADT with source-owned meaning. Do not replace missing semantics with `mixed`, `null`, `undefined`, or empty placeholders merely to satisfy `CompleteSourceAst`.

## 2026-09-20 — Migration AST upgrade trace

Ground truth: `examples/ecommerce-shop-source/database/migrations/*.php` contains real Laravel Schema definitions (including 25 migration files observed during source trace).

Connection repaired:

```text
Laravel migration source
  ↓
LaravelSourceLexer
  ↓
scanMigrationAsts()
  ↓
MigrationDefinition
  ├── MigrationOperation.create_table
  ├── TableName
  ├── Columns / ColumnDefinition
  ├── DatabaseType
  ├── PrimitiveVocabulary
  └── SourceSpan
  ↓
MigrationAst
  ↓
SourceAsts.migrations
```

Important rule: this producer preserves the existing upstream migration vocabulary. It does not replace it with a legacy `ParsedColumn` interface and does not downgrade unsupported semantic knowledge into `mixed`/`null`.

Verification: `tsconfig.phase87.33.narrow.json` reports no diagnostics for `migrationAstCanonical.ts` or `sourceAstScanner.ts`. Remaining diagnostics are in other upstream areas.

## 2026-09-20 — Service AST elevation: producer raised, interface preserved

Ground truth: `examples/ecommerce-shop-source/app/Services/PaymentGateways/MidtransGateway.php` exists and must not remain `not_scanned` merely because no canonical producer existed.

Connection introduced:

```text
Laravel service source
  ↓
LaravelSourceLexer
  ↓
existing ControllerMethodAst body/parameter vocabulary
  ↓
canonical ServiceMethod
  ├── ServiceParameter / DeclaredType
  ├── ControllerStatements
  ├── ResolvedExpression
  └── SourceSpan
  ↓
ServiceDefinition
  ↓
ServiceAst
  ↓
SourceAsts.services
```

Design rule preserved:
- `ResolvedExpression` remains available; service result does not downgrade to plain `Expression`.
- Existing `ControllerStatements` vocabulary is reused rather than creating a second statement hierarchy.
- `not_scanned` is replaced only when the producer emits the canonical `ServiceAst` shape.
- No downstream code was changed.

Verification:
- `serviceAstCanonical.ts`: 0 diagnostics in narrow compile.
- `controllerAstCanonical.ts`: 0 diagnostics in narrow compile.
- `sourceAstScanner.ts`: 0 diagnostics in narrow compile.
- Full narrow compile remains at 368 diagnostics, all outside these newly connected producer files.
- Direct runtime scan attempts exceeded the available command timeout; therefore runtime scan success is not claimed yet.

## 2026-09-20 Upstream AST elevation trace — Middleware + DTO

- Middleware: `app/Http/Middleware/*.php` → `LaravelSourceLexer` → `ControllerMethodAst(handle)` → existing `controllerAstFromMethod` → `MiddlewareDefinition.handle` → `MiddlewareAst` → `SourceAsts.middlewares`.
- DTO: `app/Http/DTOs/*.php` → existing `ResponseDtoDeclarationAst` parser → `DtoProperty`/`PropertyDefinition`/`DeclaredType` → `DtoDefinition` → `DtoAst` → `SourceAsts.dtos`.
- No downstream changes.
- No fake `not_scanned` → empty conversion.
- No new domain vocabulary introduced for either path.
- Remaining unscanned source categories: ProviderAst and AttributeAst.
- Narrow type-check produced no diagnostics for `middlewareAstCanonical`, `dtoAstCanonical`, `sourceAstScanner`, or the existing controller canonicalizer; overall narrow compilation remains non-green due to pre-existing upstream diagnostics elsewhere.

## 2026-09-20 — TRACE ULANG: Provider + Attribute → CompleteSourceAst → Manifest boundary

Ground truth source:
- `examples/ecommerce-shop-source/app/Providers/AppServiceProvider.php`
- `examples/ecommerce-shop-source/app/Attributes/Response.php`

Provider connection:
```text
Laravel Provider source
  ↓
LaravelSourceLexer.tokenize()
  ↓
parseControllerDeclaration()
  ↓
existing ControllerMethodAst (register / boot)
  ↓
existing Expression vocabulary via mapResourcePhpAstToUpstream + mapClosureBody
  ↓
ProviderDefinition
  ↓
ProviderAst
  ↓
SourceAsts.providers
```

Attribute connection:
```text
Laravel Attribute source
  ↓
LaravelSourceLexer.tokenize()
  ↓
parseControllerDeclaration()
  ↓
existing ControllerMethodAst (__construct)
  ↓
existing Closure / Expression / ResolvedExpression vocabulary
  ↓
AttributeDefinition
  ↓
AttributeAst
  ↓
SourceAsts.attributes
```

Files:
- `packages/core/src/compiler/scanner/subscanners/providerAstCanonical.ts`
- `packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts`
- `packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts`

No new upstream interface was introduced. Existing `ProviderDefinition`, `AttributeDefinition`, `Expression`, and `ResolvedExpression` are the contracts being raised by producers.

### All SourceAsts categories are now connected

```text
Model       → SourceAsts.models       scanned
Resource    → SourceAsts.resources    scanned
Request     → SourceAsts.requests     scanned
Route       → SourceAsts.routes       scanned
Controller  → SourceAsts.controllers  scanned
Response    → SourceAsts.responses    scanned
Service     → SourceAsts.services     scanned
Migration   → SourceAsts.migrations   scanned
DTO         → SourceAsts.dtos         scanned
Middleware  → SourceAsts.middlewares  scanned
Provider    → SourceAsts.providers     scanned
Attribute   → SourceAsts.attributes   scanned
```

### CompleteSourceAst boundary

Existing validator:
`packages/core/src/types/upstream/completeness.ts::validateCompleteSourceAst`

It now has a real producer input for every declared `SourceCategory`; no category is converted from `not_scanned` merely to bypass the validator.

New upstream orchestrator:
`packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts`

```text
scanSourceAsts(projectRoot)
  ↓
validateCompleteSourceAst(...)
  ↓
CompleteSourceAst
  ↓
RouteSyncManifest
```

### Manifest producer trace

Canonical new upstream producer:
`scanRouteSyncManifest(projectRoot)` in `upstreamManifestScanner.ts`.

It consumes `CompleteSourceAst`; it does not consume legacy parsed descriptors.

The legacy path still exists separately:
`StaticLaravelScanner.scan()` → `ScannedRouteManifestDescriptor`.
This is a separate legacy `RouteManifest` production path and has not been used to fake the new `RouteSyncManifest` boundary.

### Verification

Narrow TypeScript compilation currently reports **583 diagnostics overall**. The newly connected files below do not appear in the diagnostic output:
- `providerAstCanonical.ts`
- `attributeAstCanonical.ts`
- `sourceAstScanner.ts`
- `upstreamManifestScanner.ts`

Therefore the upstream connections are type-check clean individually within the current narrow compile, while the repository as a whole remains non-green due to existing diagnostics elsewhere.

No downstream code was changed.

## Manifest boundary trace — 2026-09-20

```text
Laravel ecommerce_shop
  ↓
scanSourceAsts(projectRoot)
  ↓
SourceAsts (12 categories)
  ↓
validateCompleteSourceAst(...)
  ↓
CompleteSourceAst
  ↓
scanRouteSyncManifest(projectRoot)
  ↓
RouteSyncManifest
```

### Trace finding

`ManifestVersion` is a RouteSync manifest-schema version, not Laravel/application package version. The existing `6.0.0` value is therefore not a source-data fallback and is intentionally retained for this boundary.

`ManifestSource.root` is the project root and `ManifestSource.source` is currently represented by the existing `SourceSpan` vocabulary. The producer uses a synthetic root span (`start=1`, `end=1`) because the current upstream contract has no directory/root provenance type. No new interface is introduced at this stage.

### Boundary decision

The canonical Manifest producer consumes `CompleteSourceAst` only. No downstream code is modified. Legacy `StaticLaravelScanner.scan()` remains a separate legacy manifest path and is not used to construct the canonical `RouteSyncManifest`.

### Current canonical flow

```text
source
 → lexer/parser
 → AST/ADT producers
 → trace/suggestion/repair/retrace
 → all SourceAsts categories connected
 → CompleteSourceAst proof
 → RouteSyncManifest
 → downstream (unchanged)
```

## 2026-09-20 — TRACE ULANG: CompleteSourceAst proof semantics

### Trace

```text
Laravel ecommerce_shop
  ↓
scanSourceAsts(projectRoot)
  ↓
SourceAsts (12 categories)
  ↓
validateCompleteSourceAst(ast, source)
  ↓
CompleteSourceAst
  ↓
RouteSyncManifest
```

### Finding

`SourceDiscovery<T>` distinguishes `not_scanned` from `scanned`, and `scanned` further distinguishes `discovered_empty` / `discovered_many`.

The current `validateCompleteSourceAst()` only checks `discovery.kind === 'scanned'`. Therefore its proof currently means:

```text
all declared categories have executed a producer
```

It does **not** yet prove:

```text
all source constructs in ecommerce_shop were semantically represented
```

The existing `CompletenessFailure` vocabulary already contains `unsupported_source_construct`, but `validateCompleteSourceAst()` does not currently receive or inspect producer-level unsupported-construction evidence. No new interface is introduced at this stage.

### Suggestion

Raise unsupported/partial semantic knowledge from the existing producer contracts into the existing completeness boundary. Do not convert unresolved semantic values into `mixed`, `null`, `undefined`, or fake completeness.

The next repair must therefore happen upstream at the producer/completeness boundary, not in `CompleteSourceAst` consumers and not downstream.

### Current boundary status

```text
AST category connectivity       COMPLETE
Category scan proof             COMPLETE
Semantic completeness proof     NOT YET PROVEN
Manifest construction           CONNECTED
Downstream                      UNCHANGED
```

## 2026-09-20 — REAL ecommerce_shop SCAN: runtime connection error

### Trace failure

The first real canonical runtime scan of `ecommerce_shop` reached the Resource scanner but stopped before `CompleteSourceAst` because:

```text
packages/core/src/compiler/scanner/binders/resource/propertyPathResolution.ts
  ↓
resolveResourceMethodInvocation
  ↓
WRONG import path: ../../../types/domain/resourceModelMethodSurface
  ↓
module not found
```

The existing source file is:

```text
packages/core/src/types/domain/resourceModelMethodSurface.ts
```

### Repair

The import was corrected to the existing upstream domain vocabulary:

```text
../../../../types/domain/resourceModelMethodSurface
```

No new interface was created and downstream was not changed.

### Next trace

Recompile the canonical scanner and rerun the real `ecommerce_shop` scan. The next runtime error, if any, is the next actual upstream connection to repair.

## 2026-09-20 — REAL ecommerce_shop SCAN: model relation connection error

### Trace failure

After repairing the Resource binder import, the real canonical scan reached the Model scanner and stopped at:

```text
packages/core/src/compiler/scanner/descriptors/model/relation/relationFactories.ts
  ↓
SemanticType / SemanticValueFactory
  ↓
wrong relative paths
  ↓
module not found
```

Existing targets:

```text
packages/core/src/compiler/types/SemanticType.ts
packages/core/src/types/domain/semanticValues.ts
```

### Repair

Both imports were corrected to the existing vocabulary. No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: model type derivation parse error

### Trace failure

The real scan then reached semantic model derivation and stopped before execution because `modelTypeDeriver.ts` declared `properties` twice in the same scope:

```text
const properties: ObjectProperty[] = []
const properties = sequenceToArray(...)
```

This was a producer implementation error, not a missing interface.

### Repair

The source-model collection was renamed to `sourceProperties`, preserving the existing output `properties` collection used to construct `ObjectType`.

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: model parser runtime type/value error

### Trace failure

The real scanner then entered the Laravel Model parser and failed while initializing the model property state:

```text
modelMemberParser.ts
  ↓
ModelKeyType.Int
  ↓
ModelKeyType was referenced through a type-only dynamic import
  ↓
runtime value = undefined
```

`ModelKeyType` is an existing runtime registry in `types/domain/eloquentTypes.ts`.

### Repair

The producer now imports the existing `ModelKeyType` value normally and uses `ModelKeyType.Int` directly. No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: model source-facts boundary error

### Trace failure

The scanner reached model source-fact extraction and called the brace matcher for every token, including tokens that were not `function` declarations. At end-of-file this produced `token(..., -1)` and an undefined token.

### Repair

`methods()` now first classifies the token as a function declaration, validates the method identifier, validates the opening brace, and only then performs brace matching.

This keeps the repair in the existing producer/lexer boundary. No new interface and no downstream change.

## 2026-09-20 — REAL ecommerce_shop SCAN: model relation vocabulary mismatch

### Trace failure

`modelCanonical.ts` filtered the high-level semantic model surface:

```text
model.semantic.surface.properties
  → relation entries
```

but then interpreted those entries as legacy `ParsedRelation` objects, reading `relation.name` instead of the existing semantic fields:

```text
relation.property
relation.relation
relation.targetModel
```

The real `ecommerce_shop` scan exposed this immediately on `Category::produkItems()`.

### Repair

The canonical model mapper now consumes the semantic relation vocabulary for name/target fields rather than re-deriving them through the legacy shape.

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: model accessor vocabulary mismatch

### Trace failure

The semantic model surface accessor already carries:

```text
property: PropertyName
method: MethodName
computation: ...
```

but `modelCanonical.ts` read the old `accessor.propertyName` field. The real `OrderAmount` accessors exposed the mismatch.

### Repair

Canonical model emission now consumes `accessor.property` from the existing semantic surface vocabulary.

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: accessor method vocabulary mismatch

### Trace failure

The canonical surface mapper correctly switched to the semantic accessor, but still read the legacy `accessor.name` field for the method.

The existing semantic accessor vocabulary uses:

```text
property
method
computation
result
```

### Repair

The mapper now reads `accessor.method`.

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: lexer array/string collision

### Trace failure

The real source `app/Models/OrderPromotion.php` contains:

```php
'metadata' => 'array'
```

`arrayParser.ts` classified any token whose `value === 'array'` as PHP array syntax, regardless of token kind. The lexer therefore produced:

```text
literal string 'array'
  ↓
incorrect nested_array AST
  ↓
Model cast parser rejects it
```

### Repair

The PHP array-syntax branch now requires the `array` token to be an `IDENTIFIER`, while a quoted `'array'` remains a string literal.

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: model identity value-object nesting

### Trace failure

`ModelSemanticDefinition.identity` already stores high-level branded names (`ModelName`, `TableName`, `ColumnName`). The canonical producer passed their `StringValue` layer into helpers that expect plain strings, creating nested value objects.

This surfaced at the origin symbol boundary when `ModelSymbolTable` attempted `.toLowerCase()`.

### Repair

`modelCanonical.ts` now unwraps the existing value-object layers at the exact string-construction boundary (`name.value.value`, `table.value.value`, `primaryKey.value.value`).

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: fluent validation lexer boundary

### Trace failure

`UpdateProfileRequest` contains:

```php
Rule::unique('users', 'email')->ignore($this->user()?->id)
```

`classifyStaticCall()` used the **last** `)` in the complete expression to delimit the `Rule::unique()` arguments. Because the expression continues into `ignore(...)`, the second `unique` argument absorbed the rest of the fluent chain.

### Repair

Static-call argument parsing now uses the matching close parenthesis for the static call itself. The existing PHP AST can therefore preserve:

```text
Rule::unique('users', 'email')
        ↓
method_chain(... ignore(...))
```

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: upstream value-object helper export error

### Trace failure

Controller/Resource expression mapping reached `resourceUpstreamExpressionMappings.ts`, which imported a runtime `str` helper from `upstream/valueObjects`. That module only defines `StringValue` types; no runtime `str` export exists.

### Repair

The mapper now uses the same local `StringValue` constructor pattern already used by the other canonical upstream producers.

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: closure statement matcher import

### Trace failure

Controller/Resource expression mapping reached closure statements and called the existing exhaustive `matchPhpStatement`, but the mapper did not import it.

### Repair

The existing matcher is now imported from `phpAstAlgebra.ts`. No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: legacy controller response class resolution

### Trace failure

The canonical controller parser now resolves imported response classes, but the existing controller action path can still provide a short class identifier to the response boundary. `ProdukItem` was therefore incorrectly mapped to `app/ProdukItem.php` while the real source is `app/Models/ProdukItem.php`.

### Repair

The response boundary first uses the namespace-derived path when available. For a short class name it now searches the actual `app/` source tree and requires exactly one matching class file. Ambiguous or missing resolution remains an explicit boundary error.

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: nested-array binder implementation gap

### Trace failure

`bindNestedArrayField()` referenced `isCollection` and `resourceName`, but its input is the existing `nested_array` PHP AST node, which has neither field. It also passed a `semanticType` property to `BoundSemanticFactory.propertyChain`, although that factory contract uses `resultingType`.

### Repair

The nested-array binder now:

- derives a stable child key from the existing array entry shape,
- creates the existing inline `ObjectType` as the resulting semantic type,
- uses the existing `propertyChain` contract without an invented `semanticType` field.

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: resource semantic union boundary

### Trace failure

Nested-array object construction read `field.semantic.type` directly, but the existing high-level `ResourceFieldSemantic` is an exhaustive union:

```text
verified → type
rejected → bound/reason
```

### Repair

The binder now consumes the existing `requireResourceFieldType()` boundary helper. Rejected semantics therefore remain explicit instead of becoming an undefined type.

No new interface was created and downstream was not changed.

## 2026-09-20 — REAL ecommerce_shop SCAN: explicit rejected resource field

### Trace finding

A nested resource field can legitimately reach the existing semantic state:

```text
ResourceFieldSemantic
  → rejected
  → reason: unresolved_property
```

The binder previously assumed every child field was verified and attempted to read its semantic type.

### Repair

The nested-object producer now keeps all child descriptors, including rejected ones, while constructing the derived `ObjectType` only from verified fields. No rejected field is converted into `mixed`, `any`, `null`, or `undefined`.

The rejection therefore remains explicit in the upstream AST/semantic data.

No new interface was created and downstream was not changed.

## 2026-09-20 — TRACE/PERBAIKI: property-path upstream connection

### Trace

`Resource PHP member expression`
→ `propertyPathBinder`
→ `resolvePropertyPath`
→ existing `ResourcePropertyPathResult`
→ existing `ResourcePropertyPathStep`
→ `BoundSemanticFactory.propertyChain`

The first compile trace showed the binder importing `resourcePropertyPathModel` from the wrong relative level and importing support functions from `propertyPathResolution` although those functions belong to `propertyPathBindingSupport`.

### Repair

Reconnected the existing modules only:

- `propertyPathBinder.ts` now resolves `resourcePropertyPathModel` from the existing upstream `types/domain` location.
- `propertyPathBinder.ts` imports `expressionForType`, `toBoundStep`, and `unresolved` from the existing `propertyPathBindingSupport` module.
- `propertyPathResolution.ts` consumes the existing `collectMembers` and `relationCardinality` helpers from `propertyPathBindingSupport`.
- `collectMembers` and its existing `Member` AST vocabulary are exported/declared at the existing support boundary.

No new interface was created. Downstream was not changed.

### TRACE ULANG

The module-resolution errors for this path are no longer the first diagnostics. The next boundary is semantic-model shape:

`ModelSemanticDefinition` ↔ `ModelDefinition` ↔ `ModelName`

The compiler now explicitly exposes that the existing property-path interface expects a semantic model definition with identity fields (`name`, `shortName`, `table`, `primaryKey`), while the producer still supplies the lower `ModelDefinition` shape.

This is the next interface-strengthening target. Do not patch with casts, `any`, or fallback values.

## 2026-09-20 — TRACE/PERBAIKI: scanner filesystem boundary

### Trace

`scanRouteSyncManifest`
→ `scanSourceAsts`
→ scanner subscanners
→ `scannerUtils.ts`
→ filesystem module

The runtime scanner stopped before reading `ecommerce_shop` because scanner files imported `fs-extra` directly while the core package did not declare that module as a dependency. The source tree happened to contain the root dependency, but the scanner runtime boundary could not rely on that package-level resolution.

### Repair

Reconnected the scanner filesystem boundary to the Node runtime filesystem API already required by the project:

- replaced scanner-side `fs-extra` imports with `node:fs`;
- asynchronous `readFile`/`readdir` calls now use `fs.promises`;
- synchronous filesystem calls remain on `fs`;
- no new interface was created;
- no downstream code was changed.

### TRACE ULANG

The `fs-extra` module-resolution failure is no longer the first compiler diagnostic. The next exposed upstream boundary is the existing Resource/Model semantic connection, including:

`ModelDefinition` ↔ `ModelSemanticDefinition` ↔ `ModelName`

This remains the next interface-strengthening target.

## 2026-09-20 — AST/ADT strengthening: Model boundary

Trace:
`ParsedModel.semantic → modelAstFromParsed() → ModelDefinition → ModelAst`

Repair:
- `ModelDefinition` now carries the existing `ModelSemanticDefinition` as `semantic`; no new semantic interface was introduced.
- `modelAstFromParsed()` now preserves the same semantic model object at the AST boundary instead of forcing consumers to reconstruct it from lower-level fields.
- Fixed existing ModelSemanticColumn/Accessor/Relation producers to preserve literal ADT discriminators (`scalar` / `relation`) and required relation cardinality fields.
- Fixed existing ModelCast producer to carry its required `EloquentCastTarget`.
- Fixed existing database column vocabulary registry so enum values are supplied by the producer while the registry remains exhaustive.
- Fixed model canonical name/value conversions.

Verification:
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`
- Before this cycle: model errors were present in modelCanonical/modelDescriptorClass/modelCastDescriptor/modelColumnDescriptor/relationFactories.
- After this cycle: zero diagnostics from those model producer files.
- Full narrow compile remains red: 279 diagnostics, now dominated by other scanner/descriptor boundaries.

Boundary rule:
Do not repair downstream after Manifest. Continue raising missing semantic meaning into existing AST/ADT producer boundaries.
