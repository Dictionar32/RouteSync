# RouteSync Compiler Constitution

> Status: derived from the actual implementation in `RouteSync-main` (packages/core,
> packages/cli, packages/sdk, packages/react) as it exists today, cross-checked against
> `README.md`, `CHANGELOG.md`, `KNOWN_ISSUES.md`, and `.claude/skills/run-routesync/SKILL.md`.
> This is not an aspirational manifesto — every rule below is either enforced by code or
> explicitly violated by code, and violations are called out rather than hidden.

## 0. What RouteSync Is

RouteSync is a **compiler**, not a code-gen script. It takes a Laravel backend as the single
source of truth, extracts a language-agnostic manifest from it via PHP reflection, resolves
the *semantic* meaning of every response shape through a dedicated resolution kernel, and
emits an executable frontend contract: typed API client, TanStack Query hooks, Zod validators,
Next.js Server Actions, and camelCase-mapped TypeScript types.

The tagline in `README.md` — "Compile Laravel into an executable frontend contract" — is
accurate to the code. The pipeline is a real compiler pipeline: **Extract → Manifest (IR) →
Semantic Resolution → Contract Graph → Generate**, implemented across three packages
(`@routesync/cli`, `@routesync/core`, `@routesync/sdk`) with a stable JSON IR
(`routesync.manifest.json` / `routesync.graph.json`) passed between stages.

## 1. Laravel Is the Only Source of Truth

Every fact RouteSync emits about a route, model, or resource must be traceable to something
Laravel actually declared:

- Routes come from `app('router')->getRoutes()`, not from parsing route file text with regex.
- Response shapes come from `ReflectionMethod` on the real controller class, PHP 8 attributes
  (`#[Response]` / `#[RouteSyncResponse]`), or `Schema::getColumns()` against the real database
  — never from a static list of "common Laravel conventions."
- Validation rules come from real `FormRequest::rules()` instances, instantiated and called via
  reflection — not from parsing `$request->validate([...])` call sites as a first resort (that
  path exists only as a regex-based fallback when no `FormRequest` is present).

This is why `scan --models` **requires PHP on PATH and a reachable database**
(see `README.md` → Requirements, and `LaravelRouteParser.ts` which shells out to a real Laravel
bootstrap via `spawnSync('php', ...)`). RouteSync refuses to guess what it can instead ask
Laravel to tell it directly.

## 2. Deterministic Before Probabilistic

Every resolution step in the compiler is a deterministic function of its input — there is no
LLM, no fuzzy matching, and no randomness anywhere in the pipeline. Where the system cannot
determine an answer with a fixed rule, it says so explicitly (`status: 'unknown'`,
`type: 'unknown'`) rather than guessing silently.

This shows up in two enforced places:

- **`route-classifier.ts`** is explicitly documented as "zero heuristics" — resource grouping
  is a pure function of path segments (dynamic segments are boundaries, static segments
  accumulate into a group name) and CRUD role is a pure function of `(HTTP method,
  hasTrailingParam, paramCount)`. No route name string-matching, no guessing.
- **`SemanticKernelV2.resolve()`** and **`SemanticResolutionKernel.resolve()`** both end every
  unmatched code path in an explicit `status: 'unknown'` return with a `trace` explaining why,
  rather than falling through to a best-effort default. The comment `// Default: Unresolved
  (STRICT)` in `SemanticKernelV2.ts` states this directly.

## 3. Every Resolution Must Carry Evidence

A type is never just `string` or `model: Order` — it is that answer plus a `trace: TraceNode[]`
recording which resolver produced it, what rule fired, and what the input/output was. This is
not incidental logging; it is a first-class part of the contract (`SemanticResolution` in
`packages/core/src/types/contract.ts`, threaded through every plugin in
`packages/cli/src/resolvers/plugins/*`).

This principle is what makes `routesync audit` and `routesync explain <path>` possible: they
are not separate heuristics, they are read-only consumers of the same trace data every other
resolution already produces. A resolver that returns a type without a trace is violating the
constitution, not just leaving out a nice-to-have field.

## 4. Zero Boilerplate Is a Target, Not a Given

The project's stated goal is that a developer writes **zero** frontend API code by hand. In
practice this is a spectrum the compiler is still climbing — see `ZeroBoilerplate.md` for a
concrete, code-referenced audit of where the compiler still falls short of this principle
(most notably: the `cart` domain helper pattern is hand-coded string-matching in
`HookGenerator.ts`, not a general capability driven by the manifest).

The constitution's position is: **it is better to have a documented, narrow escape hatch
(`frontend.domains` config) than to silently under-generate.** But every such escape hatch is
a debt that should eventually be paid down by making the underlying signal (in this case,
Eloquent relations + REST conventions) rich enough that the kernel can infer the same behavior
generically.

## 5. Generators Are Independent, Pure Functions of the Manifest

Each generator (`SDKGenerator`, `HookGenerator`, `ZodTierGenerator`, `ModelGenerator`,
`NextActionGenerator`, `MswGenerator`, `EchoGenerator`, `ConstantsGenerator`,
`QueryKeyGenerator`, `RoutesGenerator`, `IndexGenerator`, `TypeGenerator`, `SchemaGenerator`)
takes `(manifest, outputDir, options)` and writes files. None of them mutate the manifest, none
of them depend on another generator having already run in the same process (they read only
from the manifest object and from each other's *file naming conventions*, not from shared
mutable state). This is what the README means by "Each generator can be used standalone."

`generate.ts` enforces a fixed order (types → SDK → query keys → hooks → actions → msw → echo →
models → zod tier → routes → constants → index) purely so that later generators can reference
identifiers earlier generators are expected to have named consistently (e.g. `HookGenerator`
imports `Form` types that `ZodTierGenerator.generateForm()` will also produce) — not because of
runtime coupling.

## 6. camelCase at the Boundary, snake_case Never Leaks

All wire traffic to/from Laravel is snake_case (Eloquent/PHP convention). All TypeScript-facing
code is camelCase. The conversion happens at exactly one seam: `HttpClient`'s Axios
interceptors (`snakeCaseKeys` on the way out, and the generated `mappers/api-mapper.ts` /
`to*Read` functions on the way in). No generator is allowed to hand-roll its own case
conversion; they all route through `packages/sdk/src/mappers/case.ts` and the generated mapper
functions. `contract/api-field.ts`'s `ApiApiField` constants exist specifically so that
form → payload mappers reference the snake_case key once, in one generated place, instead of
string-literal-duplicating it across the codebase.

## 7. Confidence Is Explicit and Advisory, Not a Silent Gate

Resolutions carry a `confidence: number` (0–100), but confidence is **not** currently used to
suppress or downgrade output anywhere in the generator layer — a `resolved` status with
`confidence: 70` is treated identically to `confidence: 100` by every downstream generator.
Confidence exists today purely as diagnostic information for `routesync audit` /
`routesync explain`. Constitutionally, this is intentional: humans should decide whether 70%
confidence is good enough for their use case, not have the compiler silently drop or warn on
their behalf. But it is a currently under-used part of the contract — see
`ZeroBoilerplate.md`.

## 8. Fail Loud in the Manifest, Fail Quiet in Generated Code

If a route's response type cannot be resolved, the manifest is allowed to say so explicitly
(`response: null`, printed to the console at `scan` time as `[RouteSync Warning] Response type
could not be inferred`). But once generation happens, the *generated code* must always compile
— an unresolved field degrades to `unknown` in TypeScript, never to a build error and never to
`any`. This is consistent with `CHANGELOG.md`'s "Eliminated all instances of `any` from
`@routesync/react` runtime libraries."

## 9. The Manifest Is the Contract Between Backend and Frontend Runs

`routesync scan` and `routesync generate` are allowed to run in entirely different working
directories, at different times, potentially by different people. The only thing that crosses
that boundary is `routesync.manifest.json` (plus the debug-oriented `routesync.graph.json`,
which is the same document with all fields fully resolved). `ManifestGenerator.save()` even
explicitly preserves the `frontend` and `pages` keys from a previously-existing manifest file
on disk when scan re-runs and overwrites it — because those keys are hand-authored frontend
configuration (`frontend.domains`, `frontend.groupAliases`) that scan itself never produces and
must never destroy.

## 10. Where the Constitution Is Currently Violated

In the interest of the constitution reflecting reality rather than intent, three known
deviations are recorded here (fully detailed in `ZeroBoilerplate.md` and
`CompilerArchitecture.md`):

1. **Two independent semantic kernels exist** (`packages/core/src/semantic/SemanticKernelV2.ts`
   and `packages/cli/src/resolvers/SemanticResolutionKernel.ts`) with overlapping but
   not-quite-identical resolution rules and duplicated `mapSqlTypeToTs`/`mapCastToTs` logic.
   This violates "one deterministic source of truth per concern."
2. **`CompilerBackendGenerator.ts`, `SdkGenerator` (in `packages/sdk/src/generator.ts`),
   `ZodToTSEmitIR.ts`, and `TSPrinter.ts` form a complete, parallel code-generation backend that
   is never invoked by the CLI's `generate` command.** It is dead code from the constitution's
   perspective — a generator that produces output no user ever sees.
2. **The `cart` domain helper generation in `HookGenerator.ts`** is hardcoded string-matching
   on group names (`cartGroupName`, `itemsGroupName`, `promoGroupName`) rather than a generic
   capability derived from manifest data, contradicting Principle 4.
