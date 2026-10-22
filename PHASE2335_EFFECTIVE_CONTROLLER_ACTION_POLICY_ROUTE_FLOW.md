# Phase 2335 — Effective Controller/Action Policy in Canonical Route Flow

## Objective

Complete the existing `RouteSemanticFlow.controllerActionPolicy` contract instead of introducing another policy interface. The canonical Laravel route scanner now populates this field from the already-closed route-controller binding judgment.

## Changes

1. `laravelRouteScanner.ts` waits for `RouteControllerBindingJudgment` before resolving the policy. For `resolved`, it consumes the exact `candidate.action`; it does not re-match controller/action names in scanner wiring.
2. The existing `resolveEffectiveControllerActionPolicy` receives the bound action's policy relations, the route's already-resolved middleware names, and resource middleware declarations/exclusions projected by `projectRouteResourceMiddleware`.
3. `routeSemanticFlowFromRouteBoundary` requires a `Presence<EffectiveControllerActionPolicy>` and forwards it unchanged into the existing `RouteSemanticFlow.controllerActionPolicy` field.
4. Unresolved and ambiguous route bindings produce `{ kind: 'absent' }` for the policy field. The separate binding judgment retains the exact unresolved/ambiguous reason, so absence is not used to erase the reason.
5. The legacy `RouteScanner.scanCanonicalBundle` caller supplies explicit policy absence; it does not fabricate a complete policy without a closed binding judgment.
6. `resolveEffectiveControllerActionPolicy` now uses the existing current-controller entry in `policyCatalog` when an explicit `policy` slice was not supplied. A regression test covers this path, and the unsafe `policyCatalog!` assertion is removed.
7. The existing effective-policy algebra, resolver, middleware flow resolver, and resource middleware projection no longer import `semantic/relations` or `semantic/foundation`. The implementations operate on the arrays already declared by their existing interfaces and on the existing typed ADTs.
8. The `LaravelRouteScannerInterface` contract version is raised from 10 to 11 because the route-flow publication now carries the policy ADT.

## Authority and data-flow trace

```text
LaravelControllerScanJudgment.controllers[].actions
    + route declaration evidence
        -> RouteAst
        -> RouteControllerBindingJudgment
             ├─ unresolved / ambiguous -> Presence.absent
             └─ resolved.candidate.action
                    + route/group middleware evidence
                    + resource middleware declarations/exclusions
                    -> resolveEffectiveControllerActionPolicy
                    -> Presence.present(EffectiveControllerActionPolicy)
        -> routeSemanticFlowFromRouteBoundary(boundary, policyPresence)
        -> RouteSemanticFlow.controllerActionPolicy
        -> LaravelRouteScanArtifact.flow
```

The binding authority remains the owner of route-to-action correlation. The policy resolver remains the owner of action-scope applicability and middleware exclusion semantics. The scanner only connects those closed outputs.

## Boundaries not claimed as complete

- `laravelRouteScanner.ts` still has pre-existing `semantic/relations` imports for route parsing/emission/boundary construction. This phase removes relation imports only from the effective-policy path files listed above; it does **not** claim the entire Laravel scanner tree is relation-free.
- The route policy call currently supplies the policy relations already attached to the resolved action. Full inherited-controller policy catalog/ancestry evidence is not yet wired as an explicit closed catalog into this call. The resolver has existing inheritance/catalog inputs, but this phase does not claim that every parent `HasMiddleware` contribution is resolved end-to-end.
- The policy ADT is attached to `RouteSemanticFlow`; this phase does not yet project it into the final manifest/security output. The old boolean capability projection still requires a separate end-to-end audit.
- The old `subscanners/RouteScanner.ts` remains. Its policy is explicitly absent because that path does not receive the same closed route binding judgment; it was not deleted without tracing its remaining callers.

## Verification

- Static architecture audit: 14/14 checks passed.
- ZIP integrity: checked after packaging.
- Vitest, TypeScript typecheck, build, and CLI integration were not run in this environment. `npm run build` was not run.
