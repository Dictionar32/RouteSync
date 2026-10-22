# Phase 2359 — Route Method Authority Contract Is Executed

## Trace

`LaravelRouteScannerInterface.declarationMethodAuthority` is the declared upstream operation contract. The active scanner had that authority as a property, but the `scan` closure passed a detached module-level `declarationMethodAuthority` constant to `scanRoutes`. This made the interface property look authoritative without being the actual execution source.

The scanner now passes `laravelRouteScanner.declarationMethodAuthority` to `scanRoutes`, matching the existing pattern used for authorization and effective-controller-policy operations. The method judgment is then passed into route emission, which consumes `methodJudgment.httpMethods`.

CLI path remains:

`packages/cli/src/commands/scan.ts` → invocation manifest composition → manifest builder → source-AST pipeline → injected `LaravelRouteScannerInterface.scan` → route method authority → route method judgment → route emission.

## Scope and limitation

This fixes a real interface-to-runtime wiring defect without adding a duplicate interface or generic abstraction. It does **not** complete the broader migration away from `semantic/relations` or subscanner imports. `laravelRouteScanner.ts` still imports both, and the source-AST pipeline composition still imports multiple subscanner implementations. Those dependencies remain explicit follow-up work; this phase does not claim otherwise.

## Verification

The Phase 2359 audit checks the contract property, runtime usage, judgment consumption, pipeline injection, and CLI delegation. It is a static source audit, not a TypeScript build or CLI end-to-end test.
