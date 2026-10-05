# Phase 815 — Route Producer Authority Cutover

## Trace

The Phase 814 trace found that `RouteScanner` still owned `RouteAst` reconstruction through `routeAstFromRouteSemanticFlow`. This made the scanner both an orchestrator and a semantic constructor boundary.

## Change

`RouteAst` reconstruction has been moved out of `RouteScanner` into `compiler/scanner/subscanners/routeProducerRelations.ts`.

The new boundary has one terminal constructor:

```text
RouteSemanticFlow compatibility evidence
  -> routeProducerRelations
  -> RouteProducerInput
  -> routeProducer.produce()
  -> RouteAst
```

`RouteScanner` now delegates the AST boundary instead of constructing it itself.

## Why this is an elevation

- `routeProducer.produce()` remains the single canonical `RouteAst` constructor.
- The scanner no longer owns the upstream AST construction algorithm.
- The compatibility conversion is isolated and named as a semantic-relation boundary.
- The next cutover can replace `RouteSemanticFlow` input with direct semantic relations without moving the AST constructor again.

## Remaining frontier

The compatibility boundary still accepts `RouteSemanticFlowFactory`. It must not become a second authority. The next elevation should change the route emitters to produce `RouteProducerInput` (or an upstream semantic relation judgment) directly and then delete the compatibility bridge.

## Validation limitation

The workspace did not contain a usable local TypeScript/tsup binary after dependency installation timed out, so a full `npm run build` could not be executed in this environment. The source-level trace and structural checks were performed; build status must be re-run in the normal dependency-complete workspace.
