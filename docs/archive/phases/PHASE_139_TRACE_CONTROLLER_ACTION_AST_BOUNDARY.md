# Phase 139 — Trace Controller Action AST Boundary

## Trace

`ecommerce_shop → PhpAstValue → ControllerExpressionContract → ControllerActionContract → ScannedControllerActionDescriptor`

## Critical loss found

`ControllerActionContract.runtimeReturn` already carried resolved controller expressions, but `scanControllerAction()` did not transfer that field into `ScannedControllerActionDescriptor`. The AST meaning therefore terminated at an intermediate contract and downstream consumers could not consume it directly.

## Repair

`runtimeReturn` is now part of `ScannedControllerActionParams`, stored by `ScannedControllerActionDescriptor`, supplied by `scanControllerAction()`, and initialized explicitly by the empty descriptor.

## Invariant

Once an AST expression has been resolved into a semantic controller expression, later scanner boundaries must not silently discard it. A downstream stage must receive the already-classified expression instead of reconstructing it from source, regex, or legacy descriptors.

## Current flow

`ecommerce_shop → PhpAstValue → ControllerExpressionContract → ControllerActionContract.runtimeReturn → ScannedControllerActionDescriptor.runtimeReturn`

The next trace target is the route/manifest boundary: verify whether `runtimeReturn` survives `ControllerActionInfo → RouteScanner → RouteManifest/SourceAst`, and repair any remaining loss there.
