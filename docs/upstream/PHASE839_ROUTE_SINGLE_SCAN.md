# Phase 839 — Route single-scan canonical bundle

## Objective

Remove the second route traversal introduced by Phase 838. The route scanner
must emit the canonical route semantic flow and the canonical RouteAst from the
same `RouteEmission` stream.

## Canonical flow

```text
RouteScanner.scanSource()
        ↓
RouteEmission[] + declaration provenance
        ├── routeSemanticFlowFromRouteEmission()
        │       ↓
        │   RouteSemanticFlow
        └── routeAstFromRouteEmission()
                ↓
            RouteAst[]
        ↓
SourceAsts.routeFlows + SourceAsts.routes
        ↓
RouteSyncManifest
        ↓
lowerRouteSyncManifestToRouteManifest()
```

## Changes

- Added `RouteScanner.scanCanonicalBundle()`.
- One scanner traversal now produces both `RouteAst[]` and `RouteSemanticFlow[]`.
- `sourceAstScanner` consumes the bundle rather than invoking a separate route scan.
- `SourceAsts.routeFlows` carries the already-proven semantic route flow across
the construction boundary.
- `routeSemanticFlowFromRouteEmission()` reuses the existing
  `routeBoundaryContractFromRouteEmission()` authority.
- `routeManifestLowerer` consumes `manifest.ast.ast.routeFlows` and no longer
  invokes `RouteScanner`.
- No legacy route factory was restored to the production path.

## Verification

`audit:phase839-route-single-scan` passes and proves:

- the canonical bundle is used by source AST construction;
- route flows are carried with the source AST construction result;
- flow construction reuses the existing route boundary authority;
- the RouteManifest lowerer reads the existing route flow;
- the lowerer contains no second `RouteScanner` invocation.

A full TypeScript build is not claimed because this workspace has no installed
`node_modules`.

## Phase 840 follow-up — channel single-scan closure

The downstream manifest lowerer previously called `ChannelScanner.scan()` even
though `scanSourceAsts()` had already produced canonical `ChannelAst` values.
That caused a second traversal of `routes/channels.php`.

The lowerer now projects `ChannelAst.semantic` directly into the existing
`BroadcastChannelDescriptor` contract. It no longer imports or invokes
`ChannelScanner`, and its API no longer needs `SourceProjectIdentity`.

The CLI callers consequently lower only the already-scanned `RouteSyncManifest`.

Audit: `audit:phase840-channel-single-scan` passes.
