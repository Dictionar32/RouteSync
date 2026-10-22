# Phase 2361 — Route Producer Contract Execution

## Audit and trace

The active route scanner was constructing `RouteAst` through a module imported from `compiler/scanner/subscanners/routeProducer.ts`, even though the canonical `RouteProducer` operation contract already belongs to `types/upstream/route.ts`. The scanner contract did not expose this operation, so the producer was a hidden dependency rather than an explicit operation supplied to the scanner.

The active path is:

`CLI scan → manifest composition → LaravelSourceAstPipeline.execute → LaravelRouteScannerInterface.scan → route boundary projection → RouteProducer.produce → RouteAst`

## Change

- Strengthened the existing `LaravelRouteScannerInterface` with its `routeProducer: RouteProducer` operation; no duplicate producer interface was introduced.
- Advanced scanner and scan outcome contract versions from 24 to 25 because the scanner contract now requires a new operation.
- Added the canonical producer implementation beside the existing upstream contract in `types/upstream/routeProducer.ts`.
- Injected that operation through `createLaravelRouteScanner` and made route AST construction call the supplied producer.
- Kept `subscanners/routeProducer.ts` as a compatibility export for the retained legacy scanner, delegating to the canonical upstream implementation.
- Updated phase audits to recognize the current contract version.

## Validation

`audit-phase2361-route-producer-contract-execution.cjs` checks the contract, injection, call site, ownership, compatibility export, and continued pipeline wiring. The phase 2350–2361 static audit suite completed with 194/194 checks passing. ZIP integrity validation also passed. TypeScript typecheck, Vitest, and CLI end-to-end execution were not run because dependencies are absent from the supplied archive environment.

## Explicitly unresolved

This change removes one hidden subscanner dependency from the active route scanner path; it does not remove the active imports of `routeProducerRelations`, `route-scanner`, `scannerUtils`, `controllerAstCanonical`, or `semantic/relations`. It does not claim the route scanner is relation-free or subscanner-free. TypeScript, Vitest, and CLI end-to-end execution require dependencies that are not present in the supplied archive environment.
