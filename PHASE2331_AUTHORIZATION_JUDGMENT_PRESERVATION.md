# Phase 2331 — Preserve Existing Authorization Judgment Through Route Scan Artifacts

## Scope

Evolve the existing `LaravelRouteScannerInterface`, `RouteEmission`, and `LaravelRouteScanArtifact` contracts. No parallel authorization interface, V2 model, or generic wrapper is introduced.

## Change

The existing `LaravelRouteAuthorizationSemanticJudgment` is now carried on each `RouteEmission` as `authorization`, alongside the legacy `auth: boolean` projection still needed by the current route-boundary/AST pipeline. The route emitter receives the judgment from the upstream authority rather than inventing a new judgment.

`LaravelRouteScanArtifact` now preserves the same judgment as `authorization`, so consumers of the scanner's canonical artifact can use the upstream result without reconstructing it from `ast.auth` or reclassifying middleware. The scanner contract version is advanced from 8 to 9 because the artifact contract has changed.

Both the current `wiring/laravelRouteScanner.ts` path and the existing legacy `subscanners/RouteScanner.ts` caller now pass the already-produced judgment through the shared emitter contract. The legacy scanner path is not deleted in this phase because its reachability and consumers have not yet been proven safe to retire.

## Boundary that remains

The route-boundary and AST projection still consume `auth: boolean`; this phase does not claim that the judgment is preserved in the generated manifest. The judgment is preserved at the `LaravelRouteScanArtifact` hand-off, and the next migration should trace consumers of that artifact before extending the public IR/manifest contract.

`routeSecurityAuthority.ts` still imports `semantic/relations`. That migration remains open; moving its operations mechanically would not establish a better upstream owner.

## Verification

Run `node scripts/audits/audit-phase2331-authorization-judgment-preservation.cjs` for static contract/wiring checks. Vitest, TypeScript build, and CLI integration were not run. Per project workflow, `npm run build` was not run.
