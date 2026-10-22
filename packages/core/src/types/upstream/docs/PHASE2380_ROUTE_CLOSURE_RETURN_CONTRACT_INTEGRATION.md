# Phase2380 — Route Closure Return Contract Integration

## Status

**Implemented: closure-return evidence is now preserved in the canonical route declaration contract and consumed by active route emission. Full route-declaration authority closure remains open.**

## Root cause addressed

The PHP route declaration AST carries `returns` for a closure target, but the prior `RouteDeclarationEvidence` projection discarded those values. As a result, the scanner independently read `RouteDeclarationFlow.target.value.returns` to compute `ControllerReturnSemantic`, bypassing the canonical evidence contract.

## Code changes

1. Evolved the existing `RouteDeclarationTargetEvidence` closure variant to carry the already-defined upstream `ControllerReturnSemantic` ADT as `returnSemantic`. No PHP AST type was imported into the upstream evidence contract.
2. Updated `routeDeclarationEvidenceFromAst` to accept source-file provenance and project closure return semantics through the existing `ControllerReturnSemanticProductionInterface` shape. Its adapter delegates to the existing `controllerReturnSemanticFromValues` implementation; this does not claim the legacy producer has been retired.
3. Changed active `emitDeclaration` to construct declaration evidence once and consume `declarationEvidence.target.returnSemantic` for both query and standard closure route targets, instead of independently deriving the semantic return from `RouteDeclarationFlow`.
4. Updated the later producer boundary to use the same evidence projection with source-file provenance.
5. Updated the Phase2379 audit to verify the new behavior and registered the Phase2380 audit script in `package.json`.

## Validation executed

- `node scripts/audits/audit-phase2380-route-closure-return-contract.cjs` — **PASS 8/8**.
- `node scripts/audits/audit-phase2379-route-declaration-evidence-closure.cjs` — **PASS 8/8** after updating assertions to match the implementation.
- `node scripts/audits/audit-phase2370-scanner-contract-first-resource-authority.cjs` — **PASS 11/11**.
- `node scripts/audits/audit-phase2356-http-operation-contract.cjs` — **PASS 18/18**.
- `node scripts/audits/audit-phase2377-route-flow-single-judgment.cjs` — **PASS 4/4**.
- `node scripts/audits/audit-phase2378-route-declaration-contract-sufficiency.cjs` — **PASS 10/10** (this is a gap-detection audit; pass means the known architectural blockers remain accurately detected).
- `node scripts/audits/audit-phase2369-resource-flow-contract-evolution.cjs` — **FAIL 8/10** on two existing expectations concerning resource judgment version and path-input shape. This phase did not change that contract, and the failure is not reported as passing.

## Remaining blockers — not claimed closed

- `emitDeclaration` still dispatches on method-family judgment in the scanner.
- The active scanner still imports `semantic/relations` and invokes route subscanner emitters.
- `RouteBoundaryContract` is still assembled after `RouteEmission`; therefore a complete route declaration judgment does not yet drive the executor from upstream.
- The return production adapter still delegates to `controllerAstCanonical`; legacy semantic production has not been retired.
- Full TypeScript typecheck, package build, and end-to-end CLI regression were not run. `npm run build` was intentionally not run.

## Next integration step

Continue by evolving the existing upstream route operation/authority contracts so the method, resource, path, target-return, middleware/authorization, and target identity judgments are assembled into one closed declaration judgment before emission. Then rewire the active scanner and CLI to execute that judgment without scanner-owned semantic dispatch. Do not create a duplicate generic authority or merely relocate `emitDeclaration`.
