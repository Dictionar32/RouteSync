IMPORTANT DEVELOPMENT NOTE — POST-TRACE

Status: 2026-09-20

1. Do not widen the refactor before the current trace is complete.
2. Do not create new interfaces when an existing interface/ADT can be raised.
3. The core currently has a broad TypeScript compile-error baseline (~778 errors in the latest full-core check). Treat this as a baseline to inventory and classify; do not assume a single blocker such as `crypto` represents the whole core state.
4. RouteManifest origin boundary identified by trace:
   ecommerce_shop -> StaticLaravelScanner.scan() -> executeScanPipeline() -> scanner sub-scanners -> derived data -> ScannedRouteManifestDescriptor -> RouteManifest.
5. `executeScanPipeline()` is the assembly/orchestration point that gathers scanner outputs; `ScannedRouteManifestDescriptor` is the concrete manifest construction point implementing RouteManifest.
6. Future trace priority: start from the Laravel source of truth, trace scanner inputs and semantic loss into the manifest, and raise existing upstream interfaces/ADTs so the manifest carries complete meaning.
7. Downstream must not reconstruct meaning through defensive fallback, re-classification, regex/string probing, ternary, if/switch, or loose types when that meaning can be represented at the upstream boundary.
8. For each issue use the development loop: TRACE -> SUGGEST -> RAISE/FIX EXISTING INTERFACE -> TRACE AGAIN. Do not branch into unrelated type-free audits while the active connection is incomplete.
9. Current scanner connection under investigation: PhpAstValue -> upstream Expression -> existing ResourceExpressionModel -> controller/response consumers. Do not introduce a parallel interface for this connection.
10. After the core error baseline and manifest origin are known, continue from the manifest boundary rather than jumping directly into downstream generators.
