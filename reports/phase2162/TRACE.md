# Phase 2162 Trace

1. CLI `scan` / `sync` share the invocation-to-manifest composition.
2. `LaravelControllerScannerExecutor` receives exact invocation judgments and calls the existing integrated response pipeline.
3. `LaravelControllerResponseSemanticPipelineInterface` produces source-correlated evidence and canonical response judgments.
4. Evidence production currently admits only observed return expressions and response-reference candidates.
5. `resolveControllerActionContract()` still invokes `resolveResponse()`, and `responseAttributeScanner.ts` resolves DTO classes and response shape.
6. Phase 2162 adds a typed coverage remainder to both evidence-inventory outcomes, making the missing evidence explicit without claiming the legacy path has been retired.
7. Runtime and manifest projections remain downstream of the existing semantic judgments; no duplicate scanner or authority is introduced.
