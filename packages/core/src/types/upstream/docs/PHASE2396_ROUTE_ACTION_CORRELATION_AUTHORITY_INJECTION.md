# RouteSync Phase 2396 — Route Action Correlation Authority Injection

## Objective

Close a wiring gap found while tracing Phase 2395: the scanner's route-target correlation helper invoked the canonical `controllerActionRouteCorrelationAuthority` singleton directly. The authority already had an upstream interface, but the scanner contract did not declare it as a dependency. That meant tests or alternate scanner compositions could not supply the exact correlation authority executed by the route scanner.

## Root cause

`actionJudgmentForTarget(...)` reached into a module singleton instead of receiving the operation through `LaravelRouteScannerInterface`. The judgment implementation was upstream, but its authority was hidden from the scanner's dependency contract.

## Changes

1. Reused the existing `ControllerActionRouteCorrelationAuthorityInterface`; no parallel interface or judgment ADT was introduced.
2. Added `controllerActionRouteCorrelationAuthority` to `LaravelRouteScannerInterface` and incremented its contract version from 29 to 30.
3. Passed the exact injected authority through scanner construction, route declaration projection, and target correlation.
4. Kept closure targets explicitly unmatched for controller invocation correlation.
5. Updated the Phase 2394/2395 structural audits and the two source-structure tests that previously expected direct singleton invocation.
6. Added `audit-phase2396-route-action-correlation-authority-injection.cjs`.

## Verification

The Phase 2396 audit checks that the existing upstream authority is declared, injected, and executed; that both controller target variants use the injected authority; that closure remains distinct; and that no `semantic/foundation` dependency was added. The Phase 2380–2396 structural audit set passed 18/18 scripts, totaling 165/165 assertions. Four changed TypeScript files passed parser-level syntax checks.

A global `tsc --noEmit` attempt exited 2 before type-checking the changed path because the environment compiler rejects the repository target/lib `ES2025` settings and reports two pre-existing parse errors in `effectiveControllerActionPolicyResolver.phase921.test.ts` (lines 47 and 221). Package build, Vitest, and CLI scan/sync were not run. This is structural evidence only, not a claim of full TypeScript correctness or end-to-end CLI execution.

## Remaining architectural gaps

- `routeProducerRelations.ts` remains active under `subscanners` and still imports `semantic/relations`.
- The scanner still imports route boundary projection operations from `subscanners/route-scanner`.
- The `controllerMap` argument passed to resource boundary emission remains `relationNone()`, so the resource emitter does not resolve `controller_action` targets through its controller-action map. Correlation authority injection does not by itself close that gap.
- Invocation judgment → operation contract → integrated response → runtime executor → manifest → CLI is not validated end-to-end in this phase.
- Package build, full typecheck, Vitest, and CLI scan/sync were not run for this phase.
