# Phase 2044 — Controller Semantic Projection Interface First

## Trace finding

`controllerMethodContractFromMethod` and `controllerActionFromMethod` independently invoked the controller `semantic` projection for the same source method. This duplicated semantic dataflow construction and allowed the two views to drift. The method-contract call also passed the semantic arguments in the wrong positional order (`method, file, response, queries`) rather than the canonical `(method, controllerName, file, response, queries)` order.

## Change

- Added the upstream `ControllerMethodSemanticProjection` contract. It binds controller identity, source span, response ADT, and the resulting `ControllerSemanticDataflow` as one source-correlated value.
- Added `controllerMethodSemanticProjectionFromMethod` as the canonical producer for that projection.
- Laravel controller wiring now creates one projection per method and passes the same value to both `controllerMethodContractFromMethod` and `controllerActionFromMethod`.
- Kept the existing direct call sites compatible by defaulting each function's final parameter to the canonical projection producer.
- Reused the projected method attributes for policy derivation instead of constructing the same attribute evidence twice.
- Preserved the existing invocation semantic judgment, integrated response pipeline, controller producer, and AST/ADT artifact. No `relation/foundation` subscanner or parallel authority was introduced.

## Boundary

This change canonicalizes and shares a typed semantic projection; it does not claim that all action semantics have become a fully closed judgment. The existing semantic producer still performs the derivation. A later phase should model any remaining semantic decisions as upstream judgments before further runtime simplification.

## Verification

- Phase 2040 audit: 13/13
- Phase 2041 audit: 10/10
- Phase 2042 audit: 12/12
- Phase 2043 audit: 10/10
- Phase 2044 audit: 13/13
- Invocation/integrated-response Phase 1869 audit: 10/10
- Controller AST/ADT Phase 1944 audit: 8/8
- TypeScript parser diagnostics for the three changed TypeScript files: 0
- `package.json` JSON parse: passed

Full monorepo type-check and build were not run.
