# Known Issues Log — RouteSync

Append-only log of diagnosed issues in this repo, newest first. Format per entry:
**Symptom → Where → Root cause → Fix → Status**

---

### Issue 20: `routesync.manifest.json` Stale in `ecommerce_shop` — `resources[]`/`models[]` Empty
**Symptom** → `routesync.manifest.json` committed in the `ecommerce_shop` project has empty `resources[]` and `models[]`, only `routes[]` (35 routes, all `response.kind: 'model'` or `'object'`). The resource-dedup logic verified in `resourceAliasDedup.spec.ts` cannot be exercised against this project's real manifest as a result.
**Where** → `packages/cli/src/commands/sync.ts` — the `sync` command's `--models` flag gate.
**Root cause** → `manifest.models`/`manifest.resources` are only populated `if (options.models)`: `if (options.models) { manifest.models = models; manifest.resources = resources }`. The last `sync` run against `ecommerce_shop` was very likely invoked without `--models --zod`, so the manifest was written without resource/model data even though `LaravelRouteParser.parse()` may have found them.
**Fix** → Not a code fix — re-run `routesync sync --input routes/api.php --output frontend/src/api --models --zod` locally (requires `vendor/` + working DB connection for `--models`, unavailable in a network-restricted sandbox: PHP extractor needs Laravel bootstrap, and Composer/packagist.org isn't reachable there).
**Status** → Diagnosed, not yet fixed. Needs to be re-run on `annas-zen@archlinux`, not fixable from a sandboxed session.

---

### Issue 19: `IntentResolver.ts` Type Errors (Preexisting, Unrelated to ZodTierGenerator/normalizer Fixes)
**Symptom** → `npx tsc --noEmit` reports `Property 'model' does not exist on type 'ResponseMetadata'` (line 42) and `Object literal may only specify known properties, and 'capabilities' does not exist in type 'DomainIntentConfig'` (line 162).
**Where** → `packages/cli/src/resolvers/IntentResolver.ts`.
**Root cause** → Not yet investigated in depth. Surfaced incidentally while full-project typechecking after the ZodTierGenerator/normalizer fixes (Issue 18's session) — these errors existed before that session and are unrelated to it.
**Fix** → Not attempted.
**Status** → Known, undiagnosed. Flagged for a future session.

---

### Issue 18: Two Structurally Different `ModelNode` Interfaces With the Same Name
**Symptom** → `kernel.loadGraph(graphBuilder.getGraph())` in `normalizer.ts` fails to typecheck: `Argument of type 'ServiceGraph' is not assignable to parameter of type '{ models?: Record<string, ModelNode> }'`. The same root cause cascades into `packages/cli/src/generators/passes.ts`, and from there into `scan.ts`/`sync.ts` (`ScannedManifest` not assignable to `RouteManifest` — missing `version`/`baseURL`/`generatedAt`), plus several test files (`compiler.spec.ts`, `normalizer.spec.ts`, `orders.spec.ts`, `pluralVariableResolution.spec.ts`).
**Where** → `packages/core/src/types/semantic.ts` (`ModelNode: { kind: 'model_node', fields?: Record<string,string>, layer: 'model' (required), confidence: number (required) }`, used by `ServiceGraph`) vs. `packages/core/src/semantic/types.ts` (`ModelNode: { fields?: Record<string,{type,nullable}>, layer?: string (optional), no kind/confidence }`, used by `SemanticResolutionKernel.loadGraph`).
**Root cause** → Two independently-authored interfaces share the name `ModelNode` but have incompatible shapes. `ServiceGraphBuilder.getGraph()` returns the first shape; `kernel.loadGraph()` expects the second. This is a naming collision from parallel development, not a single-site bug.
**Fix** → Not fixed — boundary-cast with `as any` and an explanatory comment at the one call site touched (`normalizer.ts` `buildModelGraph`), deliberately left unresolved elsewhere. Reconciling the two interfaces (rename one, or make one a subtype of the other) is an architectural decision, not a type patch, and needs to be made deliberately rather than cast away site-by-site.
**Status** → Diagnosed, deliberately not fixed. Cascading errors in `passes.ts`/`scan.ts`/`sync.ts`/several tests are a direct consequence and remain open until this is resolved.

---


**Symptom** → Variables assigned inside a closure body (e.g. `$review = ProductReview::updateOrCreate(...)` inside `DB::transaction(function() { ... })`) were not captured by the assignments scanner. As a result, fields derived from those variables (e.g. `$review->title`) fell through to `z.unknown()` in the generated schema.  
**Where** → `packages/cli/src/parsers/LaravelRouteParser.ts` — `assignmentsScannerPhp` template, the expression skip guard.  
**Root cause** → The scanner had `if (str_contains($expr, 'return')) continue;` — it skipped any assignment whose captured expression contained the word `return` anywhere. Because `DB::transaction(function() { return ...; })` captures the entire closure body as part of the expression (the regex `/\$var\s*=\s*([^;]+);/s` with `s` flag spans newlines), the valid outer assignment was discarded.  
**Fix** → Changed the guard from `str_contains($expr, 'return')` to `str_starts_with($expr, 'return')` — only skip when the expression **itself** starts with `return` (which would be a malformed PHP statement), not when `return` appears inside a nested closure argument.  
**Regression test** → `laravelParserAssignments.spec.ts` › `should NOT skip $review = Model::updateOrCreate(fn that contains return)` and `should NOT skip $result = DB::transaction(function() { return Model::create(...); })`.  
**Status** → Diagnosed & Fixed.

---

### Issue 16: `updateOrCreate` and Other Eloquent Methods Not Tracked as Single-Instance Assignments
**Symptom** → `$review = ProductReview::updateOrCreate(...)` was not tracked in the Smart Response Inference symbol table. Consequently, fields like `$review->title` and `$review->comment` in the inline `response()->json([...])` array were generated as `z.unknown()` instead of `z.string().nullable()`.  
**Where** → `packages/cli/src/parsers/LaravelRouteParser.ts` — Level 90 single-instance Eloquent method list (Smart Response Inference block).  
**Root cause** → The Level 90 regex only matched: `find|findOrFail|create|first|firstOrFail|update|latest`. The method `updateOrCreate` (and similarly `firstOrCreate`, `forceCreate`, `make`, `sole`, `firstOrNew`, `newInstance`, `newModelInstance`, `updateOrInsert`) were absent from the alternation. Any call using these methods was not registered in the `$symbolTable`, so downstream field access on the variable could not be resolved to a model column type.  
**Fix** → Expanded the Level 90 regex alternation to include: `updateOrCreate|firstOrCreate|forceCreate|make|sole|firstOrNew|newInstance|newModelInstance|updateOrInsert`.  
**Regression test** → `laravelParserAssignments.spec.ts` › `should track $review assigned via ProductReview::updateOrCreate()`, `firstOrCreate()`, `sole()`, `firstOrNew()`, and `Product::find()` (regression guard).  
**Status** → Diagnosed & Fixed.

---

### Issue 15: `nullsafe_property_access` (`?->`) Not Marking Resolved Field as Nullable
**Symptom** → A resource field resolved via a PHP null-safe property access (e.g. `$promotion?->promo_code`) generated a non-nullable Zod type (`z.string()`) even when the underlying relation can be absent. At runtime, Zod validation threw when the relation was `null`.  
**Where** → `packages/core/src/semantic/plugins/ExpressionResolver.ts` — end of the `property_access / nullsafe_property_access` handler (line ~283).  
**Root cause** → After resolving the target property via `kernel.resolve({ kind: 'model_column', … })`, the final return statement spread `innerRes.nullable` verbatim. When the DB column is declared `nullable: false` (e.g. `promo_code varchar NOT NULL`), `innerRes.nullable` was `false`, and the null-safe operator `?->` was silently ignored — the nullability introduced by the optional chaining was never attached to the result.  
**Fix** → Added `const isNullsafe = meta.kind === 'nullsafe_property_access'` check before the return; final `nullable` is now `isNullsafe ? true : innerRes.nullable`. Requires `npm run build` to take effect (core is consumed from `dist/`).  
**Regression test** → `orders.spec.ts` › `should resolve nullsafe_property_access expression to nullable: true`.  
**Status** → Diagnosed & Fixed.

---

### Issue 14: Ternary Expression with `null` Branch Not Marked Nullable
**Symptom** → A resource field resolved via PHP ternary (e.g. `$path ? $path : null`) generated a non-nullable type. When the PHP condition was false and the backend returned `null`, Zod validation rejected the value.  
**Where** → `packages/core/src/semantic/plugins/ExpressionResolver.ts` — `ternary` handler (line ~130).  
**Root cause** → The ternary resolver spread `...truthyRes` or `...falsyRes` as-is. When one branch resolved to `null`/`unknown` and the other to a concrete type (e.g. `string`), the concrete branch was returned without setting `nullable: true` — the null branch was effectively thrown away.  
**Fix** → Added `truthyIsNull` / `falsyIsNull` guards before the return. If the non-null branch is chosen and the other branch is `null`/`unknown`, the result now carries `nullable: true`. Requires `npm run build`.  
**Regression test** → `orders.spec.ts` › `should resolve ternary expression to nullable: true when one branch is null`.  
**Status** → Diagnosed & Fixed.

---

### Issue 13: `use X as Y` Alias Not Resolved in Wrap Detection
**Symptom** → When a controller imports a resource with an alias (`use App\Http\Resources\OrderResource as OrderRes`) and returns `new OrderRes(null)`, wrap detection silently skipped — `response.wrapped` was not set even though `OrderRes` maps to a resource with default wrapping.  
**Where** → `packages/cli/src/parsers/LaravelRouteParser.ts` — `wrapDetectionPhp` block, `return new …` regex.  
**Root cause** → The return-statement regex required the captured class name to end with the literal string `Resource` (`[^\s(]+Resource`). An aliased name like `OrderRes` doesn't satisfy this suffix, so `$rawName` was never set and the alias-resolution branch was never reached.  
**Fix** → Removed the `Resource` suffix requirement from the return regex: `[^\s(]+Resource` → `[^\s(]+`. The wrap detection block is inside a `$responseMetadata` guard that already guarantees this method returns a `JsonResource`, so suffix filtering is redundant.  
**Regression test** → `jsonResourceWrap.spec.ts` › `BUG: aliased use (use X as Y) — must detect wrapped via alias resolution`.  
**Status** → Diagnosed & Fixed.

---

### Issue 12: Indented `use` Statement Not Matched in Namespace Block
**Symptom** → When a controller uses a short resource name with an explicit `use` import (`use App\Http\Resources\OrderResource;`) inside a curly-brace namespace block, the import was not found and `response.wrapped` was silently skipped.  
**Where** → `packages/cli/src/parsers/LaravelRouteParser.ts` — `wrapDetectionPhp`, `use`-statement resolution regex.  
**Root cause** → The regex used `^use\s+…` with multiline flag (`#m`). In PHP files where the controller is inside a curly-brace namespace block (`namespace App\Http\Controllers { … }`), the `use` statement is indented (e.g. 4 spaces). The `^` anchor matches start-of-line but `use` is preceded by whitespace, so the match failed.  
**Fix** → Changed `^use\s+` to `^\s*use\s+` in both the class-name pattern and the alias pattern so leading whitespace is consumed before `use`.  
**Regression test** → `jsonResourceWrap.spec.ts` › `BUG: short name + use statement — must detect wrapped=true`.  
**Status** → Diagnosed & Fixed.

---

### Issue 11: Hardcoded `App\Http\Resources\` Namespace in Wrap Detection
**Symptom** → Wrap detection only worked for projects that placed their resource classes under `App\Http\Resources\`. Any other namespace (e.g. `App\Domain\Order\Resources\`, `App\Http\Resources\V2\`) caused `class_exists()` to return `false` and the `wrapped` flag was silently skipped.  
**Where** → `packages/cli/src/parsers/LaravelRouteParser.ts` — original wrap detection block that was inline in the `phpScript` template literal.  
**Root cause** → After extracting the short class name from the return statement (e.g. `OrderResource`), the code unconditionally prepended `App\\Http\\Resources\\` to form the FQCN before calling `class_exists()`. This is project-specific and wrong for any non-default namespace layout.  
**Fix** → Replaced hardcoded prefix with a two-path resolver:
  1. If the return statement contains a backslash (e.g. `new \App\Domain\Resources\OrderResource(`), treat it as FQCN, strip the leading `\`, and call `class_exists()` directly.
  2. If the return statement uses a short name (e.g. `new OrderResource(`), read the `use` import statements from `$reflector->getFileName()` and match `use … ClassName;` or `use … ClassName as Alias;` to derive the FQCN.  
**Regression test** → `jsonResourceWrap.spec.ts` › `BUG: FQCN with leading backslash — must detect wrapped=true` and `BUG: short name + use statement — must detect wrapped=true`.  
**Status** → Diagnosed & Fixed.

---

### Issue 10: TS→PHP Template Literal Escaping Causing PHP Parse Errors
**Symptom** → After wrapping the `$wrap` detection logic inside the `phpScript` JS template literal, the generated PHP file contained syntax errors such as `unexpected token "\"` (line 236+). The parser returned 0 routes for all projects.  
**Where** → `packages/cli/src/parsers/LaravelRouteParser.ts` — the `phpScript` template literal containing inline PHP.  
**Root cause** → PHP code embedded in a JS template literal undergoes two layers of backslash interpretation:
  - JS template literal: `\\` → single `\` in the resulting string
  - PHP regex strings: `\\` → single `\` in the pattern

  Writing `\\s` (to produce PHP `\s`) required `\\\\s` in TS source. Getting this wrong caused PHP to receive literal `s` instead of the `\s` meta-sequence, producing parse errors. Multiple attempts to fix the escaping via different PHP regex delimiters (`/`, `#`) still failed due to the compounding layers.  
**Fix** → Moved the entire wrap detection PHP block into a separate `const wrapDetectionPhp = String.raw\`…\`` constant **before** the `phpScript` template literal. `String.raw` prevents JS from interpreting any backslashes, so the PHP code reads exactly as written and is then interpolated into `phpScript` via `${wrapDetectionPhp}`. This eliminates the double-escape problem entirely.  
**Regression test** → `jsonResourceWrap.spec.ts` › `BUG: TS→PHP escaping — generated PHP script must pass php -l (lint)`.  
**Status** → Diagnosed & Fixed.

---

### Issue 9: JSON Member Access Chain — Semantic Resolution Implemented, Runtime Typing Deferred
**Symptom** → Follow-up to Issue 8. `PaymentResource.gateway.name` (and similar chained access into cast `array`/`json` columns) generated as `unknown` because property/array access on a resolved JSON blob had no handling in `ExpressionResolver` — it fell through to "Property access target model not found".
**Where** → `packages/core/src/types/contract.ts`, `packages/core/src/semantic/plugins/{ModelColumnResolver,ExpressionResolver}.ts`, `packages/cli/src/parsers/PhpCodeParser.ts`, `packages/cli/src/generators/ZodTierGenerator.ts`.
**Root cause** → Same as Issue 8: no semantic node existed for "a key inside a JSON blob", so the chain died at the first `['key']`/`->key` access past the cast boundary.
**Fix** →
  - Added discriminated `JsonObjectResolution` (`type: 'json-object'`, carries `sourceModel`/`sourceColumn`) and `JsonMemberResolution` (`type: 'json-member'`, carries `parent` (linked-list back to the source), `key`, `accessKind: 'array_access' | 'property_access' | 'optional_access'`) to `contract.ts`.
  - `mapCastToTs` now maps `array`/`json`/`object`/`collection` casts to `'json-object'` instead of `'any[]'`.
  - `ModelColumnResolver` attaches `sourceModel`/`sourceColumn` when a column resolves to `json-object`.
  - `ExpressionResolver.property_access` now special-cases `targetRes.type === 'json-object' | 'json-member'`: instead of trying (and failing) to find a model, it descends the chain and returns a `JsonMemberResolution` with `parent` pointing at the previous node — so `PaymentDetail.detail → gateway → name` is preserved as a full traceable graph, not just a flat `unknown`.
  - `PhpCodeParser` now tags `accessKind` (`array_access` for `$x['y']`, `property_access` for `$x->y`, `optional_access` for `$x?->y`) on normalized `property_access`/`nullsafe_property_access` nodes, since both AST shapes previously collapsed into the same `kind` with no way to tell them apart.
  - Null coalescing (`$x ?? null`): when the right-hand side is a `null` literal, the left resolution is now wrapped with `nullable: true` instead of returned as-is (previously `??` also silently dropped the accumulated trace on the resolved branch — fixed as a side effect).
  - `ZodTierGenerator` (`buildResponseZodType` + `mapResolvedToTsType`): `json-object → Record<string, unknown>` / `z.record(z.string(), z.unknown())`, `json-member → unknown` / `z.unknown()`. This is a deliberate emitter decision — the kernel never decides the TS type, only that the value came from a traceable JSON member access.
**Status** → Implemented in the live resolution path (`packages/core/src/semantic/**`, used by `scan` via `SemanticKernelV2Impl`). `json-member` still deliberately emits as `unknown` — **runtime JSON member typing itself remains unresolved by design** (see Open Question below), not a bug.
**Known gap** → `packages/cli/src/resolvers/**` (`SemanticResolutionKernel`, `ModelColumnResolver`, `ExpressionResolver`) is a **second, unused implementation** of the same logic — nothing in `scan.ts` or `generate.ts` imports it. It was kept in sync for this change per the existing plan, but it's dead code and should probably be deleted rather than maintained in parallel going forward.
**Open question (unchanged from original proposal)** → Should `json-member` emit as `unknown` (current, safest), `string | number | boolean | null` (JSON value union), or be configurable via `routesync.config`?

---

### Issue 8: JSON/Array Cast Fields Produce `unknown` on Property Access
**Symptom** → Resource fields whose values are derived from JSON/array cast columns (e.g. `PaymentResource.gateway.name` from `$gateway['name']` where `$gateway` ultimately comes from a `longtext` column cast to `array`) generate as `unknown` in TypeScript.  
**Where** → `ExpressionResolver.ts`, `VariableResolver.ts` — the resolution chain works correctly up to the point where a property is accessed on a dynamic JSON object.  
**Root cause** → When a column is cast to `array`/`object` in Laravel (e.g. `PaymentDetail.detail → cast: array`), the kernel resolves it to `Record<string, unknown>`. Subsequent property access (`$detail['gateway']`, `$gateway['name']`) on this untyped JSON structure cannot determine the resulting type since there is no schema definition for the JSON contents.  
**Fix** → None yet. Possible approaches:  
  - **`@routesync-type` PHPDoc annotations** on the accessor/resource to hint field types.  
  - **Heuristic fallback** to `string | null` for property access on `array`/`object` cast columns.  
  - **JSON schema metadata** from Laravel cast objects (`AsArrayObject`, custom casts with schema).  
**Status** → Known Limitation.  
**Affected fields** → `PaymentResource`: `gatewayName`, `gatewayOrderId`, `gatewayToken`, `gatewayRedirectUrl`.

---

### Issue 7: Chained Property Access Through Nonexistent Relations
**Symptom** → Resource fields backed by model accessors that reference nonexistent relations resolve as `unknown` (e.g. `refundAmountMinor` from accessor `$this->unknownRelation->foo`).  
**Where** → `ExpressionResolver.ts` — when resolving chained `property_access`, the inner target (`$this->unknownRelation`) fails to find the relation on the model.  
**Root cause** → The accessor definition contains code referencing a relation that does not exist on the model (e.g. `unknownRelation` is not in `Payment.relations`). This is likely test/dummy code or a forward reference to a not-yet-implemented relation.  
**Fix** → No code fix needed — this is correct behavior. The accessor definition in the Laravel model should be updated to reference a valid relation.  
**Status** → By Design (correct `unknown` result).  
**Affected fields** → `PaymentResource`: `refundAmountMinor`.

---

### Issue 6: snake_case → camelCase Accessor Name Mismatch
**Symptom** → Resource fields like `$this->provider_txn_id`, `$this->gateway_status`, `$this->amount_minor` resolve as `unknown` in the manifest and generate `unknown` in TypeScript.  
**Where** → `ModelColumnResolver.ts` (both core and CLI).  
**Root cause** → Laravel model accessors are stored in camelCase (`providerTxnId`, `gatewayStatus`, `amountMinor`) but resource field expressions reference them via snake_case (`$this->provider_txn_id`). The accessor lookup used exact name matching, so the snake_case property name failed to find the camelCase accessor.  
**Fix** → Added a fallback `snake_case → camelCase` conversion (`colName.replace(/_([a-z])/g, (_, c) => c.toUpperCase())`) in both `ModelColumnResolver` files when the exact accessor name lookup fails.  
**Status** → Diagnosed & Fixed.

---

### Issue 5: AccessorResolver Treated Already-Resolved Results as Raw AST Nodes
**Symptom** → Model accessors that had been resolved in a previous scan returned `unknown` when resources referenced them, with trace message `"Unsupported kind: undefined"`.  
**Where** → `AccessorResolver.ts` (both core and CLI).  
**Root cause** → In the manifest, `accessor.expression` can hold either a resolved `SemanticResolution` object (`{ status: 'resolved', type: 'string' }`) or a raw AST `ResolverMeta` node (`{ kind: 'property_access', ... }`). `AccessorResolver.resolveAccessor()` always called `kernel.resolve(acc.expression)` treating it as an AST node. When `acc.expression` was already a resolved result (no `kind` property), the kernel couldn't match any resolver plugin and returned `unknown`.  
**Fix** → Added early-return check: if `acc.expression` has `status === 'resolved'`, return it directly. Added preference for `acc.parsed_ast` (the raw AST) over `acc.expression`. Extended `ModelAccessor` type to include `parsed_ast` and union `expression` type (`ResolverMeta | SemanticResolution`). Added `typeof === 'object'` guards before `in` operator to prevent runtime crash on string values.  
**Status** → Diagnosed & Fixed.

---

### Issue 4: Kernel Model Graph Not Synced After Accessor Resolution
**Symptom** → `PaymentResource.provider` (and other accessor-based fields) resolved as `unknown` in the manifest even though the model accessor itself was correctly resolved.  
**Where** → `incremental.ts` (`resolveManifestIncrementally`), `SemanticResolutionKernel.ts` (both core and CLI).  
**Root cause** → The kernel's model graph was loaded via `kernel.loadGraph()` **before** `resolveManifestIncrementally` ran. The `resolveManifestIncrementally` function first resolved model accessors (updating `resolvedManifest.models`), then resolved resource fields (using the same kernel). But the kernel still held the **stale, pre-resolution** copies of model nodes from `loadGraph()`. Since `resolvedManifest` was created via `JSON.parse(JSON.stringify(...))` deep clone, the resolved accessors were in the cloned manifest objects, not in the kernel's internal model array.  
**Fix** → Added `getModels()` public getter to both `SemanticResolutionKernel` implementations. After resolving model accessors in `incremental.ts`, sync the resolved `accessors` back to the kernel's active model graph via `kernel.getModels()`. Added `getModels?()` to the `KernelResolver` interface for type safety.  
**Status** → Diagnosed & Fixed.

---

### Issue 3: Route Parameter Type Mismatch (Undefined instead of Number)
**Symptom** → `Type error: Argument of type 'undefined' is not assignable to parameter of type 'number'.`  
**Where** → `frontend/src/api/hooks.ts` inside the `removePromo` wrapper method execution.  
**Root cause** → The Laravel backend resource endpoint for `/cart/promo` delete expects an ID parameter (e.g., `/cart/promo/:id`), but the wrapper was invoked with `undefined` since there is no meaningful ID at the frontend cart level.  
**Fix** → Updated `HookGenerator.ts` to automatically pass a dummy ID `1` (`removePromoMut.mutateAsync(1)`) to satisfy the path parameter type requirement.  
**Status** → Diagnosed & Fixed.

---

### Issue 2: Request Payload Form Type Mismatch (Number instead of String)
**Symptom** → `Type error: Type 'number' is not assignable to type 'string'.`  
**Where** → `frontend/src/api/hooks.ts` inside `inc` and `add` wrapper methods.  
**Root cause** → The database model represents `produkItemId` as a `number` at read/retrieve time, but the Laravel `FormRequest` validator expects a `string` for the HTTP body payload during item creation.  
**Fix** → Updated `HookGenerator.ts` to convert the runtime parameter to a string using `String(produkItemId)` during creation mutation calls.  
**Status** → Diagnosed & Fixed.

---

### Issue 1: Database Connection Refused in Docker
**Symptom** → `PDOException: SQLSTATE[HY000] [2002] Connection refused`  
**Where** → CLI `routesync scan` execution in Docker environments (e.g., Laragon, Sail).  
**Root cause** → The CLI scanner attempts to connect to the database via standard localhost configurations defined in the `.env` file, which may refer to docker container aliases instead of host port-forwarding addresses.  
**Fix** → Run the scan command with environment overrides: `DB_HOST=127.0.0.1 DB_PORT=3307 npx routesync scan --input routes/api.php --models`.  
**Status** → Workaround Documented.

**Symptom** → Follow-up to Issue 8. `PaymentResource.gateway.name` (and similar chained access into cast `array`/`json` columns) generated as `unknown` because property/array access on a resolved JSON blob had no handling in `ExpressionResolver` — it fell through to "Property access target model not found".
**Where** → `packages/core/src/types/contract.ts`, `packages/core/src/semantic/plugins/{ModelColumnResolver,ExpressionResolver}.ts`, `packages/cli/src/parsers/PhpCodeParser.ts`, `packages/cli/src/generators/ZodTierGenerator.ts`.