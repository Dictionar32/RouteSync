# RouteSync Generator Specification

Every generator lives in `packages/cli/src/generators/`, is a class with a single static
`generate(manifest, outputDir, ...)` entry point, and is invoked in the fixed order documented
in `CompilerPipeline.md` §Stage C. This document specifies each generator's actual
responsibility, inputs, and output — verified against both source and the real generated
output tree in `ecommerce_shop-main/frontend/src/api`.

## `TypeGenerator` (49 lines) → `types/index.ts`

Writes a small, fixed set of framework-shape interfaces that never vary by manifest content:
`ApiResponse<T>`, `PaginationMeta`, `PaginatedResponse<T>`, `ApiError`, plus
`export * from './api-read'` / `'./api-form'`. Its `generate()` signature literally takes
`_manifest` (underscore-prefixed, unused parameter) — confirming it is manifest-agnostic. This
file gets **overwritten again** later in the pipeline by `ZodTierGenerator.generateRead()`,
which adds the real re-exports; `TypeGenerator`'s run is a placeholder pass (see
`CompilerPipeline.md`).

## `SDKGenerator` (250 lines) → `api.ts`

The most central generator: turns every classified route into a `defineApi({...})` call tree.

- Uses `classifyRoutes()`/`buildGroupedRoutes()` from `route-classifier.ts` to get
  `{ groupName: ClassifiedRoute[] }`.
- For each route, its `getResponseInfo()` helper walks the route's resolved response metadata
  and decides: is this a `model`, a `resource`, a `primitive`, or a nested `object`? For
  model/resource responses, it further decides the emitted TS type shape based on
  `collection`/`paginated` flags:
  - Non-collection → `Read.{Base}Show`
  - Collection, non-paginated → `Read.{Base}Index`
  - Collection, paginated → an inline `{ data: Read.{Base}Show[], currentPage?, total? }` shape
    with an inline arrow-function mapper (`(res) => ({ ...res, data: res.data.map(to{Base}Read) })`)
    rather than a named import — the one place `SDKGenerator` emits an anonymous function
    instead of referencing a generated identifier.
- Decides per-endpoint whether to emit a `contract: { body, response }` block (only when `--zod`
  was passed and a schema/response type exists) and a `mapper: { body, response }` block (when a
  camelCase/snake_case transform is needed).
- Threads all endpoint `path` values through `API_ENDPOINTS.*` constants (from
  `ConstantsGenerator`) rather than inlining path strings — so every path literal exists exactly
  once in generated output.
- Emits imports for exactly the contract/mapper functions actually referenced (tracked via
  `usedContracts`/`usedMappers` sets), avoiding unused-import lint noise.

## `QueryKeyGenerator` (97 lines) → `query-key.ts`

Builds a `QueryKey` factory object, one entry per resource group, with stable array-based
TanStack Query keys (`['produk', 'list']`, `['produk', 'detail', id]`, etc.). Consumed by both
`HookGenerator` (as `queryKey:` per resource in `defineHooks()`) and directly by hand-written
frontend code that needs to invalidate/prefetch a query outside the generated hooks.

## `HookGenerator` (612 lines) → `hooks.ts`

The largest and most feature-dense generator. Responsibilities, in the order they appear in the
file:

1. **Per-resource `defineHooks()` block**: for each classified resource group, builds a `types:
   { list, detail, create, update }` metadata block (using `typeOf<T>()` phantom-type markers so
   no runtime type information is needed — purely a compile-time registry), a `queryKey:`
   reference, `endpoint:` reference to the matching `api.{group}` object from `api.ts`, and
   (when the group's routes carry a `FormRequest` schema) a `Form` type reference resolved via
   `resolveFormType()`.
2. **Cache invalidation metadata** (`cache: { action: { invalidate: [...] } }`): derived from
   Eloquent relations scanned into the manifest — see `ContractGraph.md` §6. This is the
   "strategy 5" cross-resource invalidation referenced in `.claude/skills/run-routesync/SKILL.md`.
3. **The `cart` domain wrapper** (lines ~430–593): a hand-written code-generation routine,
   gated entirely on `manifest.frontend.domains[groupName] === 'cart'` (or an object with
   `type: 'cart'`). When present, it:
   - Locates the cart group's path and infers sibling `{cartGroup}Items` /
     `{cartGroup}Promo` resource groups by string-matching sub-paths under the cart path.
   - Emits a `useCartWrapper()` function literal (not templated from a shared abstraction —
     the function body strings are built line-by-line via `lines.push(...)`) providing
     `.inc(id)`, `.dec(id)`, `.remove(id)`, `.add(id, qty)`, `.applyPromo(code)`,
     `.removePromo()` methods layered over the base CRUD hooks.
   - This is the generator most directly responsible for the "Domain-Oriented Intent Patterns"
     feature advertised in `README.md` and `CHANGELOG.md` [1.0.48] — see `ZeroBoilerplate.md`
     §2 for why this specific implementation is flagged as a boilerplate-elimination gap rather
     than a generalized capability.
4. **Unified top-level property unpacking**: every generated hook additionally spreads the
   resource name as a top-level key alongside `data`/`isLoading`/`error` (e.g.
   `const { cart, isLoading } = useCart()`), per `CHANGELOG.md` [1.0.48]'s "Unified Query Hook
   Direct Properties."

## `NextActionGenerator` (76 lines) → `actions.ts` (`--next-actions`)

Emits one `'use server'` async function per route (`{group}{Action}Action`), reading the auth
token from cookies via a generated `getAuthHeaders()` helper, calling the same underlying
`api.{group}.{action}` used by `hooks.ts`, and returning a `{ success, data }` /
`{ success: false, error }` discriminated result rather than throwing — Server Actions in
Next.js cannot propagate thrown errors across the server/client boundary cleanly, so this
generator's error handling shape is a deliberate adaptation, not a stylistic choice.

## `MswGenerator` (44 lines) → `mocks.ts` (`--msw`)

Emits Mock Service Worker request handlers, one per route, returning a static `200` with an
empty/placeholder body shaped by the route's response type. This is the shallowest generator —
it does not attempt to synthesize realistic fixture *data* (no faker-style value generation),
only the correct response *shape* skeleton.

## `EchoGenerator` (59 lines) → `echo.ts` (`--echo`, requires `manifest.channels`)

Generates Laravel Echo (WebSocket broadcast) subscription hooks from `ParsedChannel[]` data
produced by `LaravelChannelParser.ts`. This is the only generator gated on manifest content
(`channels`) that is not populated by the main `LaravelRouteParser` PHP script — channel
scanning is a separate, smaller extraction path (`LaravelChannelParser.ts`, 31 lines).

## `ModelGenerator` (102 lines) → `core/models.ts` (when `manifest.models` present)

Emits raw Eloquent model interfaces — one per scanned model, snake_case column names as-is
(these are the **pre-camelCase, pre-mapper** raw DB shapes, distinct from the camelCased
`Read` types `ZodTierGenerator` produces). Exists so hand-written code that needs the literal
wire shape (e.g. debugging, or SSR code that talks to Laravel more directly) has a typed escape
hatch.

## `ZodTierGenerator` (1663 lines) → `contract/*`, `types/*`, `mappers/*`

By far the largest single generator, internally organized as six sequential private methods
sharing one `GeneratedRoute[]` view (built once, from the same `classifyRoutes()` call every
other generator uses):

1. **`generateContract()`** → `contract/api-contract.ts`: Zod schemas for (a) every scanned
   model (columns + casts, camelCased), (b) every scanned resource (from its `toArray()`
   field tree), (c) every route's payload (from `FormRequest` rules) and response. Three
   distinct schema *categories* in one file.
2. **`generateSchema()`** → `contract/api-schema.ts`: `ApiSchema` (raw Zod schema map keyed by
   `{Group}{Action}`), `ApiFormValues` (inferred TS types from that map), `ApiDefaultValues`
   (empty-object placeholders typed against `ApiFormValues`) — the "FormValues" feature used
   directly by hand-written React form components.
3. **`generateField()`** → `contract/api-field.ts`: `ApiApiField` — a flat
   `UPPER_SNAKE: "snake_case"` constant map of every backend field name that appears in any
   form payload, so mapper functions never string-literal-duplicate a wire key.
4. **`generateRead()`** → `types/api-read.ts` (+ rewrites `types/index.ts`): the camelCase
   "Transformed" type for every model/resource/object-shaped response, applying a **flatten
   strategy** for nested resources — `payment.status` becomes a top-level `paymentStatus` field
   on the flattened interface rather than a nested `payment: { status }` object. This is a
   deliberate ergonomic choice (favoring `order.paymentStatus` over `order.payment?.status` in
   consuming components) documented in the project's own `SKILL.md`.
5. **`generateForm()`** → `types/api-form.ts`: one `{Group}Form` type per resource with CRUD
   action keys (`Create`, `Update`, ...), derived from `FormRequest` rules independent of the
   `ApiFormValues` map in step 2 — meaning form input types are generated **twice**, once as
   `{Group}Form['Create']` and once as `ApiFormValues['{Group}{Action}']`, from the same
   underlying rules. `HookGenerator.resolveFormType()` prefers the `Form` type for standard CRUD
   actions and falls back to a `{Group}{Action}Payload` contract type for non-standard ones —
   see `ZeroBoilerplate.md` §3 for why this dual representation exists and whether it should.
6. **`generateMapper()`** → `mappers/api-mapper.ts`: four categories of pure transform
   functions — model mappers (`to{Model}Read`), resource mappers (`to{Resource}Read`, applying
   the flatten strategy), route-response mappers (`to{Route}ResponseRead`), and
   form→payload mappers (`toApi{Group}{Action}`, camelCase → snake_case using the
   `ApiApiField` constants from step 3).

Internally, steps 1–6 share three private recursive tree-walkers:
`generateZodRecursive()` (SemanticNode → Zod AST → code string), `generateTSRecursive()`
(SemanticNode → TS interface field string), and `generateMapperRecursive()` /
`generateObjectReadMapper()` (SemanticNode → transform-function body string) — the same
resolved-field tree is walked three times with three different code-emission strategies rather
than being converted once into a shared intermediate emit-IR (contrast with the *other*,
unused `ZodToTSEmitIR`/`TSPrinter` backend in `packages/sdk`, which *does* build a shared emit
IR before printing — see `CompilerArchitecture.md` §5).

## `RoutesGenerator` (135 lines) → `routes.ts` (when `manifest.pages` present)

Generates a typed URL-helper object for **frontend page routes** (not API routes) — e.g.
`routes.produk.detail(id)` → `/produk/42`. This is the only generator whose input
(`manifest.pages`) is entirely hand-authored (never populated by `scan`), making it the
clearest example of RouteSync accepting manually-declared, non-Laravel-derived configuration as
first-class IR content.

## `ConstantsGenerator` (235 lines) → `constants.ts`

Not route-classification-driven like the others — instead derives `API_URL` (from
`manifest.baseURL`), `API_ENDPOINTS` (one entry per unique path, using its own
`getRouteKey(path)` naming scheme independent of `route-classifier.ts`'s `groupName`/
`actionName` scheme), `ROUTES` (frontend URL constants, separate from `RoutesGenerator`'s typed
helpers), and `Enums` (TypeScript const-object + union-type pairs derived from any DB column
detected as an enum-like `varchar`/`string` cast with a small fixed value set, or Laravel PHP
enum casts). This is the file every other generator imports path/enum constants from
(`SDKGenerator` imports `API_ENDPOINTS`; presumably `hooks.ts`/`actions.ts` reference `Enums`
where relevant) — architecturally the "constants leaf" of the dependency order.

## `IndexGenerator` (34 lines) → `index.ts`

The final step: a barrel `export * from './X'` for every file that was *actually* generated
this run (it receives `routesGenerated: boolean` and the same `options` object `generate.ts`
built, so it can conditionally include `export * from './actions'` only when
`--next-actions` was passed, etc.). This is the one generator whose behavior is explicitly
conditioned on which other generators ran, rather than purely on manifest content — it reads
CLI flags directly rather than manifest fields.

## `SchemaGenerator` → `schemas.ts` (DEPRECATED & REMOVED)

Deprecated and completely removed. Superseded by `ZodTierGenerator` / `ContractGeneratorPass` which generates `contract/api-schema.ts` and `contract/api-contract.ts` via pure Explicit Model Data Flow.

## `ValuesGenerator` (8 lines)

The smallest generator in the codebase — effectively a stub/no-op placeholder (8 lines total).
It is not invoked by `generate.ts` at all; like `CompilerBackendGenerator`, it exists in the
directory without being part of the wired pipeline.

## `CompilerBackendGenerator` (65 lines)

Documented fully in `CompilerArchitecture.md` §5 — an unwired, complete alternate backend.
Included here for completeness of the generator inventory: it is the only generator class in
`packages/cli/src/generators/` that `generate.ts` never imports.
