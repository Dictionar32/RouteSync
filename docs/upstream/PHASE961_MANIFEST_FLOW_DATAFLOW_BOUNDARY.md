# Phase 961 — Manifest Flow Boundary for Dataflow

The Laravel scanner still constructs a concrete `RouteSyncManifest` carrying `CompleteSourceAst`, but downstream semantic consumers now receive `RouteSyncManifestFlow` from the same cached scanner construction.

Production flow:

`examples/ecommerce-shop-source` → `StaticLaravelScanner.create()` → concrete construction manifest (AST retained only for lowering) → `executeUpstreamFlow()` → `RouteSyncManifestFlow` → `analyzeRouteSyncManifestDataflow()` → `SemanticDataflowInput` → `SemanticDataflowJudgment` → least-fixed-point closure → `SemanticDataflowInterface` → dataflow IR.

The graph consumer also accepts `RouteSyncManifestFlow`, so semantic graph/dataflow consumers do not require the concrete manifest.

The concrete `RouteSyncManifest` remains necessary only for AST-dependent `lowerRouteSyncManifestToRouteManifest()`. It is therefore construction-side, not the dataflow upstream contract.

The CLI creates one scanner instance and obtains both views from the same cached construction, avoiding a second source scan.
