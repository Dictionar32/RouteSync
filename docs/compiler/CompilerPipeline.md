# RouteSync Compiler Pipeline

This document traces the exact call sequence for `routesync scan --models` and
`routesync generate`, naming the real classes/methods/files involved, as opposed to an
idealized diagram. Line references are to `RouteSync-main` as uploaded.

## Stage A — `routesync annotate` (optional, mutates PHP source)

`packages/cli/src/commands/annotate.ts` (304 lines):

1. Reads the routes file text (not reflection — this stage runs *before* a developer may have
   fixed a Laravel bootstrap, so it must work on plain text).
2. For each controller method referenced by a route, regex-detects
   `return new XxxResource(...)`, `XxxResource::collection(...)`, or
   `response()->json(new XxxResource(...))`.
3. Resolves the target model from the Resource's `@mixin` docblock, falling back to stripping
   the `Resource` suffix.
4. Injects `#[Response(Model::class)]` (or `..., collection: true)`) directly above the method,
   and adds `use App\Attributes\Response;` to the controller's imports if missing.
5. Creates `app/Attributes/Response.php` on first use if it does not exist.
6. Supports `--dry-run` (prints intended diffs without writing) and `--force` (re-annotates
   methods that already carry `#[Response]`).

This stage exists purely to reduce Stage B's reliance on Stage B's own inference heuristics —
it converts "compiler infers this" into "compiler reads an explicit fact," which the
constitution (Principle 1: Laravel is the only source of truth) treats as strictly better.

## Stage B — `routesync scan` (front-end + middle-end)

`packages/cli/src/commands/scan.ts`, orchestrating `LaravelRouteParser` and `SemanticKernelV2Impl`.

### B.1 — Extraction (`LaravelRouteParser.parse()`)

1. Resolves `projectDir` (one directory above the routes file) and writes a large inline PHP
   script to `routesync-extractor-temp.php` in that directory.
2. Runs it via `spawnSync('php', ['routesync-extractor-temp.php'], { cwd: projectDir })`,
   capturing stdout/stderr separately (chosen specifically over `execSync` + shell redirects
   for Windows compatibility — see the code comment in `LaravelRouteParser.ts`).
3. The PHP script (embedded, not a separate file) does, in order:
   - **Routes**: iterate `app('router')->getRoutes()`, filter to `api/` prefix, dedupe `HEAD`,
     detect `auth`/`sanctum` middleware, and for each route's controller action:
     - Reflect on `FormRequest`-typed parameters → extract `->rules()` for validation schema.
     - Reflect on PHP 8 attributes (`#[Response]`/`#[RouteSyncResponse]`) on the method, then
       (if absent) on the resolved Resource class, then (if absent) via `@mixin` docblock.
     - Extract raw method source via `file()` + line-slicing (`getStartLine()`/`getEndLine()`),
       regex-extract local variable assignments (`$var = expr;`) for later expression tracking.
     - If still no response metadata: regex-detect `return new XxxResource(...)` /
       `XxxResource::collection(...)`.
     - If *still* none: track Eloquent query assignment patterns
       (`$x = Model::find(...)`/`::all()`/`::paginate(...)`/auth `user()` calls) into a
       per-method `$symbolTable`, then tokenize any `return response()->json([...])` /
       `return [...]` array literal with PHP's real `token_get_all()` and a hand-written
       recursive-descent `parseArrayTokens()` to build a structural `{kind, fields}` tree —
       this is the only place raw PHP expression syntax is truly parsed, not regexed.
     - As a last resort, regex-extract `$request->validate([...])` inline rules if no
       `FormRequest` was found.
   - **Models** (`--models` only): for every class under `app/Models` extending
     `Illuminate\Database\Eloquent\Model`, reflect columns via
     `Schema::getColumns($model->getTable())`, `getHidden()`, `getAppends()`, `getCasts()`;
     parse `@property-read` docblock tags and Laravel 11-style `Attribute::make(get: fn() =>
     ...)` accessors / legacy `getXAttribute()` methods (regex against the method's real source
     slice) for computed properties; parse `$this->belongsTo(Model::class)`-style relation
     method bodies for relation metadata.
   - **DTOs**: for every class under `app/Http/DTOs`, reflect public typed properties into the
     same column-shaped structure as models (so DTO-shaped responses get typed the same way
     model-shaped ones do).
   - **Resources**: for every class under `app/Http/Resources`, extract the `toArray()` method's
     `return [...]` literal the same tokenizer way, plus its local assignments.
   - Emits one JSON blob (`{routes, models, resources}`) via `echo json_encode($result)`.
4. Node reads stdout, strips BOM/CRLF, locates the first `{` (to skip stray PHP notices), and
   `JSON.parse`s the rest.

### B.2 — Manifest Assembly (`ManifestGenerator.generate()`)

Wraps `{routes, models, resources}` plus `version`, `baseURL`, `channels`, `generatedAt` into a
`RouteManifest`. This is the unresolved IR — every "raw_code" field still holds PHP source
text plus lightweight `hints` (see `IntermediateRepresentation.md`).

### B.3 — Semantic Resolution (`SemanticKernelV2Impl`, inline in `scan.ts`)

For every model accessor, resource field, and route response field in the manifest:

1. If the field is `raw_code`, parse its `code` string into a `ParsedASTNode` via
   `PhpCodeParser.parseExpression()` (a small, dedicated PHP-expression-to-AST parser — separate
   from the tokenizer embedded in the PHP extraction script).
2. Call `kernel.resolve(ast, context)` where `context` carries `layer` (`resource`/`model`/`route`),
   `fileName` (the owning class name, used for `$this` resolution), and `assignments` /
   `resolvedAssignments` (so a local variable used later in the method resolves to whatever it
   was assigned from, resolved once and memoized per assignment).
3. The kernel is pre-loaded (`kernel.loadGraph(...)`) with a `ServiceGraph`-shaped view of all
   scanned models (fields with cast-aware TS types, relations, accessors) so property-access
   resolution (`$this->produk->nama`) can walk from a Resource's implicit `$this` model, through
   a relation, into a column — entirely offline, using only what was scanned.
4. Every resolved field gets a `.resolved` key attached (or is left absent if `status ===
   'unknown'`), and models get their `.accessors[key]` rewritten to
   `{ expression_code, parsed_ast, expression: <resolution> }` — an explicit trace-carrying record,
   not a plain type string.

### B.4 — Persistence

- `resolvedManifest` (all resolutions applied) is saved to `routesync.manifest.json`
  (`ManifestGenerator.save()`, which also preserves any pre-existing `frontend`/`pages` keys —
  see `Constitution.md` §9).
- The same fully-resolved object is *also* written verbatim to `routesync.graph.json` — this is
  the file `routesync audit` and `routesync explain` read.
- Console output lists every route with method/path/auth flag, and an explicit
  `[RouteSync Warning] Response type could not be inferred` line for any route whose response
  resolution failed — this is the compiler's only "diagnostic to the terminal" moment.

## Stage C — `routesync generate` (back-end)

`packages/cli/src/commands/generate.ts` runs generators in this fixed order against the loaded
`RouteManifest`:

```
1.  TypeGenerator.generate()          → types/index.ts (ApiResponse/PaginationMeta/ApiError wrapper types
                                         + re-exports of api-read.ts / api-form.ts)
2.  SDKGenerator.generate()           → api.ts (defineApi() call tree, one entry per classified route)
3.  QueryKeyGenerator.generate()      → query-key.ts (TanStack QueryKey factory per resource group)
4.  HookGenerator.generate()          → hooks.ts (defineHooks() registry + cart-domain wrapper if configured)
5.  NextActionGenerator.generate()    → actions.ts   [only with --next-actions]
6.  MswGenerator.generate()           → mocks.ts     [only with --msw]
7.  EchoGenerator.generate()          → echo.ts      [only with --echo AND manifest.channels present]
8.  ModelGenerator.generate()         → core/models.ts  [only if manifest.models present]
9.  ZodTierGenerator.generate()       → contract/api-contract.ts, contract/api-schema.ts,
                                         contract/api-field.ts, types/api-read.ts, types/api-form.ts,
                                         types/index.ts (overwritten again here), mappers/api-mapper.ts
10. RoutesGenerator.generate()        → routes.ts    [only if manifest.pages present]
11. ConstantsGenerator.generate()     → constants.ts (API_URL, API_ENDPOINTS, ROUTES, Enums — single
                                         source of truth consumed by api.ts and hooks.ts)
12. IndexGenerator.generate()         → index.ts (barrel re-export, aware of which optional files exist)
```

Ordering is dictated by naming dependencies, not runtime coupling (see
`CompilerArchitecture.md` §5 / `Constitution.md` §5): `TypeGenerator` runs first only because
its `types/index.ts` is the file `ZodTierGenerator`'s `generateRead()`/`generateForm()` steps
(9) will overwrite with the real re-exports later — the first write is effectively a
placeholder immediately superseded.

`ZodTierGenerator.generate()` itself (`packages/cli/src/generators/ZodTierGenerator.ts`,
1663 lines) is internally staged as its own mini-pipeline of six private methods:
`generateContract → generateSchema → generateField → generateRead → generateForm →
generateMapper`, each writing one file, sharing a `GeneratedRoute[]` view built once from the
manifest via `classifyRoutes()`/`buildGroupedRoutes()` from `route-classifier.ts` — the same
classifier `SDKGenerator` and `HookGenerator` use, guaranteeing all four "tiers" (api, hooks,
contract, types) agree on resource-group names.

## Stage D — Introspection (`routesync audit`, `routesync explain`)

These commands never touch the Laravel project or re-run PHP. They operate purely on
`routesync.graph.json` (the fully-resolved manifest from Stage B.4) using the second,
introspection-only kernel (`SemanticResolutionKernel` — see `CompilerArchitecture.md` §4):

- **`audit`** (`audit.ts`) walks every resolvable field in the graph, re-resolves it, and
  buckets failures into named categories (`Missing MethodReturn Resolver`, `Missing
  ResourceGraph Resolver`, `Dynamic Runtime Value`, `External Service Boundary`, etc.) based on
  the last `trace` entry's `rule` string, then reports resolved/total counts.
- **`explain <path>`** (`explain.ts`) takes a dotted path like `login.post.data.user.role` or
  `PaymentResource.provider`, locates the matching resource/model/route in the graph, and
  prints the full resolution trace for that one field — effectively "why did the compiler infer
  this type."

## End-to-End Summary (Real Numbers from `ecommerce_shop-main`)

Per `routesync.graph.json` in the uploaded project: **35 routes, 20 models, 4 resources**
scanned, generating (per `.claude/skills/run-routesync/SKILL.md`, cross-verified against the
actual `frontend/src/api/` tree) 14 files across `api.ts`, `hooks.ts`, `actions.ts`, `index.ts`,
`query-key.ts`, `contract/{api-contract,api-schema,api-field}.ts`,
`types/{api-read,api-form,index}.ts`, `mappers/api-mapper.ts`, `core/models.ts`, plus the
legacy `schemas.ts` and `constants.ts`.
