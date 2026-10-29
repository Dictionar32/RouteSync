# Phase 2713 — Fully Typed Runtime Scanner Operations / CLI Manifest Audit

## Scope and honesty boundary

This phase makes one real ownership correction in the active runtime: route middleware applicability/exclusion semantics no longer live under `compiler/scanner/upstream/route`. The implementation is now `compiler/semantic/routeMiddlewareFlowResolver.ts`, exposed as a typed operation object. Callers use `routeMiddlewareFlowResolver.resolve(input)`; the former exported function `resolveRouteMiddlewareFlow(input)` was removed, and `scanner/wiring/route/routeMiddlewareFlowResolver.ts` is now only a compatibility re-export.

This is **not** a claim that the entire scanner is now wiring-only. The remaining scanner subdirectories and parser implementations are inventoried below and still require ownership migrations. Full typecheck, tests, and CLI E2E were not verified because this workspace has no installed dependency/type environment; `npx tsc --noEmit` fails before project diagnostics with missing global libs, `node`/`vitest` types, and unsupported target/lib values in the installed `tsc` invocation.

## Runtime CLI → manifest trace

1. `packages/cli/src/commands/scan.ts` and `commands/sync.ts` receive the CLI action and call the injected `manifestScanOperation.scan(...)`.
2. `packages/cli/src/manifestScanOperationInterface.ts` defines `RouteSyncCliManifestScanOperationInterface` and its `routeSyncCliManifestScanOperationFactory` as `export const ...: Interface = Object.freeze({ ... })`.
3. `packages/cli/src/upstreamCompositionFactory.ts` assembles semantic capabilities and injects the manifest composition authority into the runtime composition.
4. `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` canonicalizes source-project identity, discovers controller sources, reads source documents, binds requested/canonical identities, runs the PHP source invocation pipeline, judges invocation results, closes the source-to-judgment inventory, and delegates only a validated inventory receipt to `manifestBuilderOperationPreparation.prepare(...).build()`.
5. `packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts` uses upstream `php-parser` to extract PHP AST/syntax evidence; semantic name resolution and invocation judgments are separate authorities.
6. Manifest builder/inventory outcomes remain explicit discriminated judgments; rejected/blocked inventory is not normalized into a successful manifest.

## Ownership decision

`scanner` should be a composition/wiring boundary, not the owner of parsing, AST algebra, semantic resolution, symbol inventory, or domain contracts. The correct target shape is:

```text
CLI scan/sync
  -> CLI composition root
  -> scanner wiring/runtime composition only
       -> PHP frontend/parser
       -> syntax/AST evidence
       -> semantic judgments and resolution
       -> closed source/invocation inventory
       -> manifest builder authority
  -> manifest judgment/projection
```

Existing upstream contracts should be reused. The TypeScript handbook supports named interfaces as structural contracts; `php-parser` documents whole-file AST parsing via `parseCode` and token extraction via `tokenGetAll`. The current CLI adapter already uses `php-parser`, so a second scanner-owned lexer/parser stack is an ownership duplication to migrate, not another parser to expand.

## Source change made

- Added `packages/core/src/compiler/semantic/routeMiddlewareFlowResolver.ts`.
- Added `RouteMiddlewareFlowResolverInterface` with `kind`, `contractVersion`, and typed `resolve` operation.
- Exported `routeMiddlewareFlowResolver: RouteMiddlewareFlowResolverInterface = Object.freeze({...})`.
- Updated consumers and tests to call `.resolve(...)`.
- Removed `packages/core/src/compiler/scanner/upstream/route/routeMiddlewareFlowResolver.ts`.
- Reduced `packages/core/src/compiler/scanner/wiring/route/routeMiddlewareFlowResolver.ts` to a compatibility re-export only.

## Remaining scanner debt

At audit time, `compiler/scanner` still contains implementation-bearing folders: `audit`, `binders`, `descriptors`, `lexer`, `operations`, `orchestrator`, `resolvers`, `semantic`, `subscanners`, `symbols`, and `upstream`, plus `wiring` and tests. Thus the architecture request is only partially satisfied. The highest-priority next migration is the legacy `frontend/php` parser/tokenizer stack to the existing PHP frontend/syntax ownership, then semantic/resolver/binder/symbol implementations to their semantic/domain owners. Keep only composition and compatibility wiring under scanner after all consumers and tests have moved.

The raw scanner source audit still finds exported declarations in function form; those counts are an inventory, not proof every declaration is on the runtime path. Convert each *live runtime operation* to a named interface and `export const operation: Interface = Object.freeze({ ... })`, update call sites to operation properties, and then remove the old function export. Do not mechanically rewrite every function or convert tests/helpers blindly.

## Validation

- Static import search: no remaining `resolveRouteMiddlewareFlow` identifier/import in core source.
- Static ownership check: the resolver implementation is outside `compiler/scanner`; scanner compatibility file only re-exports it.
- Typecheck/test/E2E: **not verified**. Attempted `npx tsc --noEmit`; toolchain failed before meaningful project type diagnostics due missing global/type dependencies and unsupported compiler target/lib settings. No test pass is claimed.
