# RouteSync Compiler Architecture

Source of truth for this document: `packages/*/src`, `README.md`, `.claude/skills/run-routesync/SKILL.md`,
and direct inspection of a real generated output (`ecommerce_shop-main/frontend/src/api`).

## 1. Package Topology

RouteSync is a monorepo of five publishable packages plus one meta-package (`routesync` itself,
re-exporting the others). Each has a distinct architectural role:

| Package | Role | Key entry points |
|---|---|---|
| `@routesync/cli` | The compiler front-end + middle-end: parsers, semantic resolver plugins, generators, CLI commands | `packages/cli/src/index.ts` |
| `@routesync/core` | Shared runtime + the canonical IR type definitions + `SemanticKernelV2` | `packages/core/src/index.ts` |
| `@routesync/sdk` | The **runtime** DSL consumed by generated code (`defineApi`, `endpoint`, `resource`, `createService`) plus a second, unused generation backend | `packages/sdk/src/index.ts` |
| `@routesync/react` | TanStack Query hook factories (`defineHooks`, `createCrudHooks`) consumed by generated `hooks.ts` | `packages/react/src/index.ts` |
| `@routesync/vue` | Vue Query composable equivalent of `@routesync/react` (much smaller — only `useApiForm`) | `packages/vue/src/index.ts` |

The CLI is the only package that does compilation. `@routesync/core`, `@routesync/sdk`, and
`@routesync/react`/`@routesync/vue` are **runtime dependencies of the code the CLI generates** —
they ship to the end user's frontend bundle, whereas `@routesync/cli` does not.

## 2. The Three Compiler Stages

RouteSync's pipeline mirrors a traditional compiler's front-end/middle-end/back-end split,
mapped onto three CLI commands:

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   annotate  │ ──▶ │       scan        │ ──▶ │  generate   │
│ (optional,  │     │ (front+middle-end)│     │ (back-end)  │
│  one-time)  │     │                   │     │             │
└─────────────┘     └──────────────────┘     └─────────────┘
  mutates PHP          produces IR              consumes IR,
  source (adds          (manifest +              emits TS
  #[Response])           graph JSON)              source files
```

- **`annotate`** (`packages/cli/src/commands/annotate.ts`, 304 lines) is a source-to-source PHP
  transformer: it detects `return new XxxResource(...)` patterns in controllers and injects
  `#[Response(Model::class)]` attributes, creating `app/Attributes/Response.php` if missing.
  This is the only stage that writes to the Laravel codebase.
- **`scan`** is the compiler's **front-end** (lexing/parsing PHP into structured facts via
  reflection — see `IntermediateRepresentation.md`) fused with its **middle-end** (semantic
  resolution — see `SemanticSpecification.md`). It outputs both `routesync.manifest.json`
  (the portable IR) and `routesync.graph.json` (the same document with every field's
  `resolved`/`parsed_ast` populated — effectively a fully-elaborated IR used for
  introspection by `audit`/`explain`).
- **`generate`** is the compiler's **back-end**: 13 independent generator classes each consume
  the manifest and emit one or more TypeScript files. See `GeneratorSpecification.md`.

`watch` (`packages/cli/src/commands/watch.ts`) is a thin wrapper that re-runs `scan` + `generate`
on file-change; it introduces no new architecture. `sync` (`sync.ts`, 369 lines) is a combined
scan+generate convenience command for single-repo (non-split backend/frontend) setups.

## 3. Extraction Is Not Static Analysis — It's Reflection Against a Booted App

The most architecturally significant fact about `scan` is that **it does not parse PHP source
with a PHP parser library**. Instead, `LaravelRouteParser.ts` writes a temporary PHP script
(`routesync-extractor-temp.php`) into the target Laravel project root, and executes it with
`spawnSync('php', ...)`. That script:

1. Fully boots the Laravel application (`bootstrap/app.php`, `$kernel->bootstrap()`).
2. Reads real, resolved routes from `app('router')->getRoutes()` — including middleware stacks,
   so `auth`/`sanctum` detection is exact, not pattern-matched against route file text.
3. Uses `ReflectionMethod`/`ReflectionClass` on real, autoloaded controller/model/resource
   classes to read PHP 8 attributes, docblocks (`@mixin`, `@property-read`), constructor
   parameter types, and method return types.
4. Falls back to regex + a hand-rolled PHP tokenizer (`token_get_all`, and the recursive-descent
   `parseArrayTokens()` function embedded in the PHP script) **only** for parsing the literal
   array/expression syntax inside a method body that reflection cannot see into (e.g. the
   contents of `return response()->json([...])` or a `JsonResource::toArray()` body).
5. Calls `Schema::getColumns($table)` — a real, connected-database schema read — to get exact
   column names, SQL types, and nullability for every Eloquent model.

This is why `scan --models` has hard requirements: PHP on `PATH`, a working `vendor/autoload.php`
and `bootstrap/app.php`, and a **reachable database connection**. There is no fallback path that
works without these — RouteSync intentionally does not attempt to reimplement Laravel's routing
or Eloquent's schema introspection in JavaScript.

## 4. Two Semantic Kernels (Architectural Duplication)

There are two independently-implemented semantic resolvers in this codebase, and they are used
in different contexts:

- **`SemanticKernelV2`** (`packages/core/src/semantic/SemanticKernelV2.ts`, 599 lines) — a single
  large `resolve()` method that pattern-matches on `ParsedASTNode.kind` (variable, method_call,
  property_access, binary_expression, ternary, type_cast, static_method_call, ...). This is the
  kernel `scan.ts` actually instantiates (`new SemanticKernelV2Impl()`, aliased on export from
  `@routesync/core`) and uses to resolve every raw-code field, model accessor, and resource
  field in the manifest before it's saved to disk.
- **`SemanticResolutionKernel`** (`packages/cli/src/resolvers/SemanticResolutionKernel.ts`,
  87 lines) — a plugin-registry design (`PrimitiveResolver`, `ModelColumnResolver`,
  `AccessorResolver`, `ResourceGraphResolver`, `MethodReturnResolver`, `ExpressionResolver`,
  `FrameworkRegistryResolver`, each in its own file under `resolvers/plugins/`) with a shared
  `CycleDetector`. This kernel is instantiated only by `audit.ts` and `explain.ts` — it
  re-resolves nodes already stored in `routesync.graph.json` for introspection/diagnostic
  purposes, entirely independent of the resolution `scan` already performed.

Both kernels implement `mapSqlTypeToTs`/`mapCastToTs`-equivalent logic and largely-overlapping
rules (Eloquent query builder methods, `whenLoaded`/`when` conditional wrappers, Carbon date
methods, auth user detection). They were evidently built at different times for different
purposes (one for the generation-critical path, one for the introspection tooling) and were
never unified. See `SemanticSpecification.md` for the detailed rule-by-rule comparison and
`ZeroBoilerplate.md` for why this is flagged as technical debt rather than intentional design.

## 5. The SDK Package Contains Two Independent Code-Generation Backends

`packages/sdk/src` contains not just the **runtime** DSL (`defineApi`, `endpoint`, `resource`,
`createService`, consumed by every generated `api.ts`) but also a complete second **generator**
implementation:

- `packages/sdk/src/generator.ts` (`SdkGenerator.generate(manifest)`) — builds
  `GeneratedSDKModule[]` directly from a manifest.
- `packages/sdk/src/emitter/ZodToTSEmitIR.ts` — converts those modules into a lower-level
  "TS Emit IR" (imports, Zod schema AST, interfaces, functions).
- `packages/sdk/src/emitter/TSPrinter.ts` — prints that Emit IR to a single TypeScript file.
- `packages/cli/src/generators/CompilerBackendGenerator.ts` — the only caller of the three
  above, merging everything into one `routes/api-service.ts`.

**`CompilerBackendGenerator` is never imported by `generate.ts`, `sync.ts`, or any CLI command.**
It is fully-formed, independently testable code that produces no output any user of `routesync
generate` will ever see. The actually-wired generation path (`SDKGenerator` +
`ZodTierGenerator`, both in `packages/cli/src/generators/`) evolved as a completely separate,
higher-fidelity implementation that supersedes it in every respect the two overlap (contract
tier, mapper tier, form tier). This is dead code, not a feature flag — see
`ZeroBoilerplate.md` §1.

## 6. Runtime Architecture (What Ships to the Browser)

Independent of the compiler, `@routesync/core`'s `HttpClient` (`packages/core/src/client/HttpClient.ts`)
is the single Axios wrapper every generated `api.ts` call eventually reaches:

- Request interceptor: `snakeCaseKeys()` on outgoing `data`/`params`.
- File/Blob detection (`hasFiles`) automatically switches the request body to `FormData`
  (`toFormData`) instead of JSON when any nested value is a `File`/`Blob`.
- Response interceptor: normalizes Axios errors into `{ success: false, message, status, errors }`.
- `setToken`/`removeToken` manage a single `Authorization: Bearer` default header.
- `client.config.validateResponse` + `client.config.onValidationError` gate optional Zod
  validation of every response, independent of whether `--zod` codegen ran.

`@routesync/sdk`'s `defineApi()` wraps each declared endpoint in a `callable` closure that:
resolves path params via `PathResolver`, applies any per-route `contract`/`mapper`
(request-body validation+snake-casing, response validation+camelCasing+flattening), and calls
the shared `HttpClient` singleton (`getClient()` — a module-level singleton set once by
`createClient()`).

`@routesync/react`'s `defineHooks()` wraps each resource group's endpoints in generated
`use{Group}` hooks built on `createCrudHooks` (CRUD-shaped resources) and raw
`useQuery`/`useMutation` (custom, non-CRUD actions), with cache-key management delegated to
per-group `QueryKey` factories generated by `QueryKeyGenerator`.

## 7. Directory Map (Compiler-Relevant Files Only)

```
packages/
├── cli/src/
│   ├── commands/         annotate, scan, generate, sync, watch, audit, explain
│   ├── parsers/           LaravelRouteParser (PHP reflection bridge), PhpCodeParser
│   │                      (expression → AST), LaravelChannelParser, OpenApiParser,
│   │                      PHPRouteParser (framework-agnostic PHP route regex fallback)
│   ├── resolvers/         SemanticResolutionKernel + plugins/ (introspection-only kernel)
│   └── generators/        13 generator classes — the compiler back-end (see GeneratorSpecification.md)
├── core/src/
│   ├── types/             semantic.ts (IR v2 spec), route.ts, contract.ts, config.ts, request.ts,
│   │                      response.ts, emit.ts — the canonical type contracts
│   ├── semantic/          SemanticKernelV2 (production kernel used by scan), ASTNormalizer,
│   │                      SchemaResolver
│   ├── client/            HttpClient, Request, Response, Interceptor
│   ├── auth/              TokenManager, AuthMiddleware
│   ├── routing/           PathResolver, QueryBuilder
│   └── graph/             ServiceGraphBuilder
├── sdk/src/
│   ├── defineApi.ts, endpoint.ts, resource.ts, createService.ts, createClient.ts   (runtime DSL)
│   ├── generator.ts, emitter/ZodToTSEmitIR.ts, emitter/TSPrinter.ts                (unused backend)
│   └── mappers/case.ts, mappers/schema.ts
└── react/src/hooks/       defineHooks, createHooks, createCrudHooks, useQuery, useMutation,
                           useApiForm, endpointAdapters
```
