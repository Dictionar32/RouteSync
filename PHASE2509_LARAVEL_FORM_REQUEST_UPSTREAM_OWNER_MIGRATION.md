# RouteSync Phase 2509 — Laravel FormRequest Upstream Owner Migration

## Scope

This change addresses the active FormRequest path only. It is not a claim that all Laravel scanner subscanners or all `semantic/relations` dependencies have been retired.

## Changes made

1. Added `packages/core/src/compiler/scanner/laravelFormRequestScanner.ts` as the active scanner owner.
2. Added `export const laravelFormRequestScanner: LaravelFormRequestScannerInterface = Object.freeze(...)`, making the existing upstream scanner contract the concrete exported boundary.
3. Updated `compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts` to inject `laravelFormRequestScanner` directly. Removed the composition-root adapter that delegated to the legacy `FormRequestScanner` barrel.
4. Added the request producer implementation and its request-specific support modules under `compiler/scanner/operations/`, outside `subscanners`.
5. Left the legacy `subscanners` files untouched. They are not edited as the repair target; they remain only as legacy files pending consumer migration and retirement.
6. Added `scripts/audits/audit-phase2509-laravel-form-request-upstream-owner.cjs` to verify the new owner and wiring.

## Verification performed

The Phase2509 audit reports 8/8 structural assertions passing:

- new scanner owner exists;
- composition root imports the new owner;
- composition root injects `laravelFormRequestScanner` directly;
- active FormRequest wiring no longer imports the old `../subscanners` barrel;
- producer implementation exists outside `subscanners` and uses the named upstream producer contract;
- upstream scanner contract remains present;
- no direct `semantic/foundation` import in the migrated scanner or producer.

Command:

```sh
node scripts/audits/audit-phase2509-laravel-form-request-upstream-owner.cjs
```

## Known unresolved work — do not treat as closed

- The migrated FormRequest path still has direct `semantic/relations` imports in five files (scanner, producer, request AST helper, and validation helper modules). The audit reports this explicitly. This phase does **not** claim relation-free closure.
- The full transitive import graph has not been proven free of `semantic/foundation`.
- `types/upstream/requestProducerInterface.ts` still imports parser AST types and `TypeInterner` from compiler-owned paths. The upstream parameter contract therefore remains leaky and needs a separate contract evolution that promotes the source evidence types to their proper owner instead of duplicating them.
- The composition root still imports other legacy subscanner implementations for response, schema, migration, DTO, query, service, middleware, and provider. They were not migrated in this focused change.
- Full typecheck, Vitest, package build, and CLI end-to-end tests were not completed. A targeted `tsc` run is currently blocked by existing repository diagnostics, missing Node type declarations, and existing diagnostics in files outside this change; see the captured terminal output from the work session for the first errors.

## Architecture decision

The active FormRequest contract is now selected directly from an interface-typed exported owner, rather than a wiring adapter that calls the legacy subscanner barrel. This is a real wiring/ownership improvement, but the broader interface-first objective is not complete until the remaining relation imports, compiler-owned input types, and other active subscanner consumers are closed and regression-verified.

## Technical references

- TypeScript interfaces name structural contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript discriminated unions model closed alternatives: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Laravel routing source semantics and route declarations: https://github.com/laravel/docs/blob/13.x/routing.md
