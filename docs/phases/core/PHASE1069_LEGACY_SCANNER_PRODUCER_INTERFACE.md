# Phase 1069 — Legacy Scanner Producer Interface

`StaticLaravelScanner` remains a compatibility facade, but it must consume the canonical
`ManifestBuilderInterface` producer rather than call the compatibility `scanRouteSyncManifest`
function directly.

The canonical direction is:

`SourceProjectIdentity -> ManifestBuilderInterface -> RouteSyncManifest`

The legacy facade delegates to `manifestBuilder.build(sourceProject)` and keeps only compatibility
exports and legacy descriptor/subscanner helpers. Upstream semantic types remain free of downstream
wiring imports.
