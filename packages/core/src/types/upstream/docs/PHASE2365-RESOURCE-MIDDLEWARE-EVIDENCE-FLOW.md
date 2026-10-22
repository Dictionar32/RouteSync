# Phase 2365 — Resource middleware evidence flow

## Root cause

`RouteDeclarationEvidence` already preserves `resourceMiddleware` and `resourceMiddlewareExclusions`, but `routeResourceMiddlewareRules` consumed `RouteDeclarationAst` directly while constructing the existing `RouteResourceRegistration`. This meant one part of the registration contract was still projected from scanner syntax after the evidence projection had been formed.

## Change

The existing projection helper now consumes `RouteDeclarationEvidence`. The registration's middleware rules, scopes, include lists, and exclusion lists are derived from the same evidence value used by the `RouteProducerInput.declaration` field. No new interface or registration ADT was added.

## Ownership boundary

This change improves evidence preservation and consistency; it does not claim that resource middleware is a fully resolved semantic judgment. The current evidence still describes source declarations, and `routeResourceMiddlewareRules` still transforms that evidence into `RouteResourceMiddlewareRule`. A later authority-level change must decide whether this transformation belongs in the existing route resource semantic operation and must trace all consumers before changing the boundary.

## CLI trace

`packages/cli/src/commands/scan.ts` → `buildManifestWithInvocationPipeline(...)` → `LaravelSourceAstPipeline` → `LaravelRouteScannerInterface.scan(...)` → `routeBoundaryContractFromRouteEmission(...)` → `routeProducerInputFromRouteBoundary(...)` → `RouteProducer.produce(...)` → `RouteAst` → manifest projection.

The active scanner call remains wired through `routeProducerInputFromRouteBoundary`. This phase changes the evidence source used for registration middleware; it does not remove the existing `subscanner` or `semantic/relations` imports from the route path.

## Validation limits

The Phase 2365 audit checks source structure and active call-path markers. It does not establish TypeScript correctness, runtime behavior, or end-to-end CLI output. Type-check and integration tests remain unrun in this environment.
