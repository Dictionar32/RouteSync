# Phase 1821 — Laravel Controller Interface-First Retirement

## Objective

Elevate the upstream controller contract before touching the legacy scanner implementation. The intended end state is to retire `compiler/scanner/subscanners/ControllerScanner.ts` and remove the intermediate controller-index path, not to preserve or relocate the subscanner.

## Trace findings

1. `LaravelControllerScannerInterface` existed but did not express source identity and integrated invocation response together in each controller artifact.
2. `laravelSourceAstPipeline.ts` still calls `ControllerScanner.scanCanonicalBundle(...)` directly.
3. `RouteScanner.ts` still consumes `RelationIndex<string, RelationIndex<string, ControllerActionInfo>>`.
4. `ResourceScanner` currently receives resource dataflow extracted from that same legacy controller index.
5. The controller scanner interface therefore is not yet a drop-in replacement. Deleting the file now would break active production consumers and erase source-to-route/resource correlations.

## Interface-first changes

- Raised `LaravelControllerScannerInterface` and its judgment/artifact contract to version 3.
- Added a closed `LaravelControllerInvocationDelivery` ADT distinguishing provided source-bound delivery from explicitly absent delivery. It does not use an optional lookup function or `undefined` as semantic state.
- Added `sourceFile` and `invocationResponse` to each controller artifact so the future upstream implementation must preserve provenance and integrated invocation outcome with the AST and actions.
- Updated the boundary contract to state that `ControllerScanner` must be retired after the upstream interface owns the correlated products.
- Exported the new ADT from the core package.

## Deletion gate

**The subscanner is not deleted in Phase 1821.** This is deliberate: the new interface has not yet been implemented by the production pipeline, and route/resource consumers still rely on the legacy controller action index. Removing it now would be a destructive deletion rather than a completed migration.

Next implementation step: implement the upstream controller authority against this contract, then migrate route and resource consumers to the returned upstream judgments/artifacts. Once production references to `ControllerScanner` and its index reach zero, delete the subscanner and rerun the retirement audit.

## Verification scope

The Phase 1821 audit is a source-level contract/trace audit. It is not a TypeScript build, typecheck, or end-to-end test.
