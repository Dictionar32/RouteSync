# RouteSync Phase2372 — Active Scanner Audit + Declaration Evidence Contract

## What changed

1. Audited the active scanner path from `laravelSourceAstPipeline.ts` through `laravelRouteScanner.ts`, `RouteEmission`, `RouteBoundaryContract`, `RouteProducerInput`, and `RouteProducer`.
2. Added `scripts/audits/audit-phase2372-active-route-declaration-authority.cjs` and its JSON report. It verifies current active-path wiring and records unresolved contract ownership rather than treating a legacy scanner audit as proof.
3. Evolved the existing `RouteDeclarationEvidence` contract:
   - canonical Laravel method vocab now belongs to the evidence owner and scanner interface preserves the public aliases;
   - target evidence is a closed discriminated union;
   - bindings and route constraints no longer use `unknown`;
   - resource middleware has a named evidence type;
   - absent group controller/domain, custom binding key and source span are explicit ADT variants;
   - unused closure return AST nodes are no longer copied into neutral evidence.
4. Updated the Phase2366 audit expectations to the current Phase2371/2372 authority contract and version.

## Audit results

- Phase2372 active declaration authority audit: 16/16 checks passed.
- Phase2371 existing declaration evidence authority: 10/10 passed.
- Phase2367 resource plan/path consumption: 8/8 passed.
- Updated Phase2366 resource-flow authority execution: 12/12 passed.

These are static source audits, not type-checks or end-to-end execution tests.

## Not completed

The active scanner still computes `RouteDeclarationFlow`, repeats target projection through `controllerNameOf` / `actionNameOf`, resolves standard/query paths, imports `semantic/relations`, and imports emitter/path operations from `subscanners/route-scanner`. `RouteEmission` remains declared in the emitter and is projected into the boundary and producer input afterward. No complete upstream route-declaration judgment currently owns all of those decisions.

No TypeScript type-check was run because the extracted workspace has no local `node_modules/.bin/tsc`. `npm run build` was not run. CLI end-to-end was not run. The user-local `/home/annas-zen/Documents/RouteSync` directory is not available here; changes are in the extracted Phase2371 workspace only.
