# Phase 816 — Route Producer Authority Cutover

## Trace result

The Phase 815 trace established that `routeProducer.produce()` is the only `RouteAst` constructor, but the public `RouteScanner.scan()` API still returned `RouteSemanticFlow` and the route emitter still constructed `RouteSemanticFlowFactory` values.

Phase 816 makes the scanner's public route boundary canonical:

```text
RouteScanner.scan()
  -> RouteAst[]
  -> sourceAstScanner
  -> SourceAsts.route_asts
```

The legacy semantic flow remains only inside the compatibility construction bridge for now. It is no longer the public scanner result.

## Changes

1. `RouteScanner.scan()` now returns `readonly RouteAst[]` and delegates to `scanAsts()`.
2. The scanner's public contract no longer exposes `RouteSemanticFlow`.
3. Added `audit:phase816-route-producer-authority`.
4. The audit verifies that `routeProducer.produce()` is the single route AST constructor and records remaining legacy reachability.
5. The audit explicitly reports the next cutover rather than pretending the legacy factory is already gone.

## Trace after change

```text
Laravel route syntax
  -> RouteDeclarationAst
  -> route scanner evidence
  -> RouteSemanticFlow compatibility construction
  -> routeProducerRelations compatibility bridge
  -> RouteProducerInput
  -> routeProducer.produce()
  -> RouteAst
  -> SourceAsts.route_asts
```

The first public boundary is now the upstream AST. The remaining legacy segment is internal and must be removed rather than propagated.

## Remaining frontier

The audit reports:

- `routeProducer.produce()` constructor count: 1
- public `RouteScanner.scan()` returns `RouteAst[]`: yes
- `RouteScanner` still references `RouteSemanticFlowFactory`: yes, internally
- `routeEmitter` still constructs `RouteSemanticFlowFactory`: yes
- `routeProducerRelations` still consumes the legacy flow: yes
- `AstSemanticAuthorityPipeline` direct consumers: 0
- route semantic-flow references: 59 files

Therefore the next required operation is **not another adapter**. It is a direct emitter cutover:

```text
RouteDeclarationAst
  -> route semantic relations
  -> RouteProducerInput
  -> routeProducer.produce()
  -> RouteAst
```

After that, `RouteSemanticFlowFactory` and the route descriptor tree can be audited for zero reachability and removed only where the compiler proves they are unused.

## Validation limitation

The extracted workspace has no local `tsc` or `tsup` executable (`node_modules/.bin/tsc` and `node_modules/.bin/tsup` are absent). Therefore a full TypeScript/DTS build cannot honestly be marked PASS in this checkpoint. The phase audit itself runs successfully.
