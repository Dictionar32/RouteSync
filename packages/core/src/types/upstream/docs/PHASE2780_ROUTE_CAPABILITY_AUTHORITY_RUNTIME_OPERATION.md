# Phase 2780 — Route Capability Authority Runtime Operation

## Runtime change

- Replaced the exported `createRouteCapabilityAuthority(algebra)` function declaration with the interface-first runtime operation `routeCapabilityAuthorityFactory`.
- `RouteCapabilityAuthorityFactoryInterface` names the factory contract and fixes its `kind` and `contractVersion`.
- `routeCapabilityAuthorityFactory.create(algebra)` composes the upstream authority by delegation. It does not re-classify route evidence, invent a reasoning primitive, or replace a missing semantic result with a primitive default.
- Updated the public barrel and the existing architecture note to point at the object operation.

## Trace

`Laravel route scan` → `route semantic flow / typed route input` → `routeCapabilityAuthority.resolve(input)` at `compiler/semantic/route-boundary/boundaryInputResolution.ts` → capability/evidence projection → manifest builder and lowering → CLI generator.

The route authority object is consumed by the actual route-boundary runtime. The scanner-to-manifest path remains outcome-indexed: `LaravelSourceAstProjectionJudgment` has distinct complete and blocked arms, and `upstreamManifestBuilder` executes the source-AST pipeline before projection.

## Explicit limits

- `collections.ts` is intentionally empty as required. Imports that still depend on symbols from it remain a repository-wide typecheck blocker.
- `SourceScanJudgment` exists as a closed ADT but is not yet wired into `laravelSourceAstPipeline`; the existing pipeline judgment remains authoritative for now.
- This audit is structural and does not replace TypeScript compilation, unit tests, or end-to-end generation tests.

## Usage example

```ts
import {
  routeCapabilityAuthorityAlgebra,
  routeCapabilityAuthorityFactory,
} from '@routesync/core';
import type { RouteCapabilityCrudInput } from '@routesync/core';

const authority = routeCapabilityAuthorityFactory.create(routeCapabilityAuthorityAlgebra);
const input: RouteCapabilityCrudInput = {
  kind: 'route_capability_crud_input',
  method: 'GET',
  path: routePath,
  action: actionName,
};
const judgment = authority.resolve(input);
// `judgment.kind` is a closed route_crud_role_resolution ADT.
// Consumers use `judgment.role` and `judgment.evidence`; they do not infer a new role.
```

The canonical production path already binds the same factory to the canonical algebra once and exports `routeCapabilityAuthority`; production consumers call `routeCapabilityAuthority.resolve(input)` rather than reconstructing authority composition.
