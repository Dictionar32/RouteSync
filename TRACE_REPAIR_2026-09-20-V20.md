# RouteSync — Trace / Suggestion / Repair v20

## Source evidence
- Laravel source: `examples/ecommerce-shop-source`
- PHP files discovered: 111
- Legacy manifest: rejected as evidence

## Tool repair
v19 trusted the declared `Promise<RouteAst[]>` return type and could therefore miss an AST construction lie.
v20 verifies three separate facts:
1. `RouteAst` is structurally backed by the existing high-level `ParsedRoute` model.
2. `RouteScanner.scanAsts()` actually constructs `{ kind: 'route_ast', definition, source }`.
3. `pipelineScanner.ts` actually consumes `sourceAsts.routes` instead of rescanning routes.

## Repair applied
### Route AST
Existing `RouteAst` was too low-level/incompatible with the canonical semantic route model. It now carries the existing `ParsedRoute` directly:

`Laravel route source -> ParsedRoute -> RouteAst -> SourceAsts.routes -> pipeline`

No parallel route interface was introduced.

### Pipeline
Removed the second route scan from `pipelineScanner.ts`.
The pipeline now reads:

`discoveredItems(sourceAsts.routes.items).map(routeAst => routeAst.definition)`

This removes one source re-interpretation boundary.

## Trace result
- status: `REPAIR_REQUIRED`
- Laravel PHP files: 111
- RouteAst type valid: yes
- RouteAst actual construction: yes
- RouteAst consumed by pipeline: yes
- pipeline rescans remaining: 3
  - `FormRequestScanner`
  - `ControllerScanner`
  - `ResourceScanner`
- runtime `Map`: 1, classified as local algorithmic index requiring review, not proven semantic loss
- free `Record`: 0 in checked pipeline/source-AST files
- nullish fallback: 0 in checked pipeline/source-AST files
- optional fallback: 0 in checked pipeline/source-AST files

## Remaining first-loss candidates
### 1. FormRequest
`RequestAst` still wraps a lower-level `RequestDefinition`, while the pipeline requires the richer existing `FormRequestSource` model. This means the upstream AST currently does not yet prove that every semantic field required downstream is represented without reconstruction.

**Repair direction:** promote the existing `FormRequestSource` semantics into the existing `RequestAst` boundary; do not create another request interface. Then pipeline consumption can become direct and the `FormRequestScanner.scan(projectRoot)` rescan can be removed after field-level lineage verification.

### 2. Controller
`ControllerAst` is already canonical for controller semantic dataflow, but the pipeline still calls `ControllerScanner.scan(projectRoot)`. The next trace must compare every field required by the controller map against `ControllerAst.action.semantic` and existing high-level controller descriptors before removing that rescan.

### 3. Resource
`ResourceAst` is still produced through a scanner call that reconstructs resource semantics from source. The existing high-level `ParsedResource`/resource descriptor model must become the authoritative payload before removing the resource rescan.

## Important rule
Do not replace these rescans with casts. If an upstream ADT lacks a required field, strengthen the existing upstream model first. The trace must fail closed when a required manifest field has no proven source lineage.

## Validation limitation
Repository-wide TypeScript compilation is currently blocked by the environment because `@types/node` and `vitest/globals` type definitions are unavailable. This is not treated as compile-green evidence.
