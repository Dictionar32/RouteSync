# Phase 2261 — Runtime Return Projection Ownership

## Change

The controller action resolver no longer owns a local `resolveRuntimeReturn` implementation or imports the resource expression mapper directly. It consumes `ControllerRuntimeReturnProjectionInterface<ControllerMethodAst>` and receives the projection through the existing execution composition root.

The scanner AST adapter projects the existing `ControllerRuntimeReturn` ADT and passes the exact `SourceFile` supplied by the invocation into `mapResourcePhpAstToUpstream`. This also removes the previous synthetic `'<controller-action>'` source label from runtime return expressions.

## Ownership distinction

- `ControllerReturnSemanticProductionInterface` continues to own semantic return judgment.
- `ControllerRuntimeReturnProjectionInterface` owns AST-to-runtime-expression projection only.
- `ControllerResourceBindingAuthorityInterface` continues to own closed resource-binding judgments.
- Integrated controller response remains owned by `LaravelControllerResponseSemanticPipelineInterface`.

This is not a claim that the legacy action resolver or all subscanner dependencies have been retired. It closes one more projection responsibility without moving the old resolver into another file.

## Verification

Run `node scripts/audits/audit-phase2261-runtime-return-projection.cjs` from the repository root. This is a static source audit, not a TypeScript build or test-suite result.
