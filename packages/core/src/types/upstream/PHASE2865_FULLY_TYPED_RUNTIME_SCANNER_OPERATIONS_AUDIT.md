# Phase 2865 — Fully Typed Runtime Scanner Operations

## Scope

This phase migrates middleware identity comparison from a boolean helper in the runtime resolver to an upstream-defined, actionable domain judgment. It preserves the existing CLI manifest composition and continuation contracts and does not add a generic result/continuation framework.

## Upstream contract and runtime application

`packages/core/src/types/upstream/routeMiddleware.ts` now defines:

- `RouteMiddlewareIdentityComparisonJudgment`, with `continueWith`;
- `RouteMiddlewareIdentityComparisonHandlers<Result>`, with `onSameIdentity` and `onDifferentIdentity`;
- `RouteMiddlewareIdentityAuthorityInterface`, with `identify` and `compare` operations.

The runtime authority is exported interface-first from `routeMiddlewareKnowledgeCatalog.ts`:

```ts
export const routeMiddlewareIdentityAuthority: RouteMiddlewareIdentityAuthorityInterface = Object.freeze({
  kind: 'route_middleware_identity_authority',
  identify: identifyMiddlewareImplementation,
  compare: compareMiddlewareIdentityImplementation,
});
```

`routeMiddlewareFlowResolver.ts` now calls `routeMiddlewareIdentityAuthority.compare(...).continueWith(...)` to distinguish matching exclusions from unrelated middleware. The old `middlewareIdentityEqual` boolean helper and the exported `routeMiddlewareIdentity` arrow are removed. The domain decision is consumed through named handlers instead of a boolean conditional at the resolver boundary.

## CLI manifest runtime trace

The canonical manifest path remains:

`CLI scan/sync` → `composition.manifestScanOperation.scan(input)` → `routeSyncCliManifestScanOperationFactory` → `controllerInvocationManifestCompositionAuthority.compose(input)` → source discovery and identity binding → controller invocation inventory judgment → `ControllerInvocationManifest.continueForDriftAudit(handlers)` → CLI projection/output.

The middleware identity judgment is a supporting semantic operation, not a replacement for manifest composition or manifest building. The existing manifest continuation is retained instead of adding a duplicate wrapper.

## Structural audit

Run:

```bash
npm run audit:phase2865-fully-typed-runtime-scanner-operations
```

The generated `PHASE2865_AUDIT.json` records the exact scanned file set, remaining relation imports, remaining callable-const exports, and checks. The current snapshot reports:

- 15/15 structural checks pass;
- 790 production TypeScript files scanned;
- no `export function` declarations in the audited production scanner/upstream/CLI path;
- no `semantic/relations` imports in CLI;
- 175 relation imports across 87 files remain in the broader audited scope;
- 199 unannotated callable `export const` declarations remain according to the audit's regex-based detector;
- `packages/core/src/types/upstream/collections.ts` remains 0 bytes.

The callable export count is a structural regex estimate and is not a claim that all other exports have been fully type-reviewed. Relation migration is not complete.

## Verification limits

- `package.json` parses successfully.
- TypeScript `transpileModule` syntax checks pass for the changed contract, implementation, resolver, and test file.
- Targeted `tsc` invocations remain nonzero because the existing dependency graph contains unrelated errors. No diagnostics directly name the changed production files; the test invocation additionally reports that `vitest` declarations are unavailable.
- Vitest is not installed in this snapshot. Tests, full typecheck, package build, and CLI E2E are not claimed to pass.

## Next steps

1. Continue migrating callable exports in actual scanner/upstream runtime paths, reusing existing upstream contracts where appropriate.
2. Replace remaining primitive scope-membership branches with domain judgments where that improves domain clarity; do not add generic relation/result infrastructure.
3. Migrate the remaining `semantic/relations` imports in small, behavior-preserving slices.
4. Keep `collections.ts` empty and validate all consumers before changing public runtime contracts.
