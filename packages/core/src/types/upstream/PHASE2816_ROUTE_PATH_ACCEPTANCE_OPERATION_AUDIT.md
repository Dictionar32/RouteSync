# Phase 2816 — Route Path Acceptance Domain Operation Audit

## Root cause

The route declaration parser consumed an exported boolean helper that recomputed `routePathTokenFact(cursor, method)` twice: once to read `expectation` and once to evaluate the expectation. The fact was only data, and the acceptance rule lived in a separate lookup table. This duplicated policy application and kept a function-shaped runtime export in the scanner path.

## Change

- `RoutePathTokenFact` now owns `continueForAcceptance`, a route-path-specific operation over its closed `string | any` expectation.
- `routePathTokenFactFactory` is an interface-first frozen operation object.
- `routePathTokenAcceptanceOperation` is an interface-first frozen operation object and creates one fact per acceptance check.
- `routeDeclarationParser` now calls `routePathTokenAcceptanceOperation.accepts(at, method)`.
- The exported standalone `routePathTokenFact` and `isRoutePathToken` functions were removed. Internal fact creation remains private.
- Existing route-syntax semantic judgment ADT and proof continuation remain intact; no parallel contract was added.
- `packages/core/src/types/upstream/collections.ts` remains 0 bytes.

## Runtime trace

`CLI scan/sync -> manifestScanOperation.scan -> route declaration scanner -> routeDeclarationParser.parse -> findPathCursor -> routePathTokenAcceptanceOperation.accepts -> routePathTokenFactFactory.create -> RoutePathTokenFact.continueForAcceptance -> route declaration AST -> semantic route projection -> manifest projection`.

The Phase 2816 change covers the route path acceptance boundary. It does not claim full CLI end-to-end verification.

## Verification boundaries

The Phase 2816 source audit checks interface-first exports, operation ownership, single fact construction, caller migration, absence of the legacy predicate, and the zero-byte collections constraint. Typecheck, build, full tests, and CLI E2E must be reported separately and only if executed successfully.
