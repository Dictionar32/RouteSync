# RouteSync Phase 2606 — Upstream Public Contract Export Closure

## Scope

Continue the Phase 2605 audit of the executable CLI → manifest → upstream semantic composition path. The priority is architectural path correctness and ownership, not pretending that currently missing semantic production is complete.

## Root cause found

`packages/cli/src/standaloneCompositionLoader.ts` imports `requestTypeDerivationContract` from the public `@routesync/core` package entry. The canonical value existed in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`, but `packages/core/src/index.ts` did not export that value. In addition, the public barrel exported the composition interface but omitted the named reasoning, verifier, decision, authority, integrity, and inference contract types required by a host composition root.

That creates a public-boundary mismatch: the intended host-owned path asks consumers to supply a canonical contract-backed composition, but the package boundary does not fully publish the canonical contract and capability types that make that composition implementable without deep imports.

## Changes

- Exported the existing `requestTypeDerivationContract` value from `@routesync/core`; did not create a duplicate contract.
- Exported the existing capability interfaces and associated inference/candidate/assessment types from the same upstream contract module through the public core barrel.
- Extended `scripts/audits/audit-phase2605-cli-manifest-upstream-trace.cjs` to verify the canonical contract value and the existing host capability types are public exports.
- Preserved the existing fail-closed composition path. No `RequestType[]` fallback was introduced.
- Did not add `semantic/foundation` or `semantic/relation` imports.

## Active path after closure

```text
Host composition module
  └─ imports canonical contract + capability interfaces from @routesync/core
      └─ exports requestTypeDerivationSemanticComposition
          └─ CLI loader checks canonical contract identity and capability operations
              └─ CLI composition factory binds manifest authority
                  └─ core assembler checks capability contract identity
                      └─ CLI program receives the exact assembled composition
```

## Validation

- `audit-phase2605-cli-manifest-upstream-trace.cjs`: 11/11 assertions passed.
- `audit-phase2605-cli-host-composition-loader.cjs`: 10/10 assertions passed.
- `audit-phase2571-upstream-identity-operation-algebra.cjs`: 13/13 assertions passed, including syntax transpilation.
- `audit-phase2599-upstream-inventory-operation-export.cjs`: 6/6 assertions passed.
- `package.json` JSON parse: passed.
- `audit-phase2579-authority-integrity-closed-adt.cjs`: could not run because it references missing file `packages/core/src/types/upstream/requestTypeDerivationAssessmentIntegrityRuntime.ts`. This is a stale audit path, not evidence of a passing audit.
- Full TypeScript typecheck, package build, Vitest, and real Laravel CLI end-to-end execution were not run; this workspace archive has no `node_modules`.

## Still unresolved (do not misrepresent as complete)

The repository still does not provide a concrete production source-bound semantic reasoning producer and an independent verifier proving the full canonical derivation-law inventory. The host composition boundary is now publicly implementable against the canonical contracts, but the production semantic implementation and end-to-end manifest proof closure remain outstanding.

## Laravel domain reference

Laravel routing binds a route declaration to either a controller action (including `[Controller::class, 'method']`) or an invokable controller, and resource routes expand into multiple named action declarations. RouteSync's source inventory should therefore preserve declaration identity and source occurrence separately, and derive controller/action semantics upstream before manifest projection; a CLI or generator must not infer those semantics from incomplete `RequestType[]` values.

Reference: https://laravel.com/docs/12.x/controllers
Reference: https://api.laravel.com/docs/12.x/Illuminate/Routing/Route.html
