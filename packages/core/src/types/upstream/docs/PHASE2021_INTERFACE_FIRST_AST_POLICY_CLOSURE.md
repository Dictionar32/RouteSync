# Phase 2021 — Interface-first AST policy closure

## Scope

This phase takes the uploaded Phase 2020 RouteSync tree as its baseline. It makes a narrow source change in `compiler/frontend/php/astClassifierRuntime.ts` and records the remaining migration boundary. It does not run `npm run build` and does not add a `relation` or `foundation` subscanner.

## Trace findings

- `LaravelControllerInvocationSemanticJudgmentInterface` already owns the canonical four-outcome invocation ADT. Do not introduce a second invocation judgment model.
- `invocationSemanticRuntimeExecutor.ts` delegates to the existing upstream authority. Its current runtime boundary is already appropriately thin for one invocation.
- `laravelControllerScannerInterface.ts` consumes `LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt`, so scanner input is not a loose batch of raw invocation results.
- The response semantic pipeline already accepts the canonical invocation judgment and must preserve its exact outcome and source correlation.
- The expression branch of `astClassifierRuntime.ts` reconstructed a callback-bound `SemanticDecisionContract` for every input. The policy identity and precedence were therefore represented by an input-created contract even though the precedence itself was canonical upstream data.

## Source change

The expression policy is now a module-level `AST_CLASSIFICATION_CONTRACT` with stable rule identities and `SCANNER_AST_EXPRESSION_PRECEDENCE`. Each classification input supplies candidate evidence; it no longer creates a new contract and captures a per-input `Set` of candidate IDs. The existing proof verification is retained.

This is an intermediate compatibility-safe change, not the completed declarative-policy migration. The expression policy still uses deprecated callback rule adapters because parser capabilities currently return AST nodes directly. A complete cutover must first define typed AST classification evidence, declarative policy facts, a proof-bearing closed judgment, and a projection that maps the selected rule identity to the corresponding parser capability. Replacing the old contract with `resolveFirst()` alone would discard the existing proof/precedence verification and is not accepted as a complete fix.

## Invariants preserved

1. One canonical Laravel invocation judgment ADT remains in use.
2. Integrated response consumers retain the original invocation judgment rather than reclassifying its outcome.
3. Runtime execution does not become a semantic authority.
4. No `relation/foundation` subscanner is added.
5. AST proof verification remains enabled during the compatibility stage.

## Verification

Run `node scripts/audits/audit-phase2021-interface-first-ast-policy-closure.cjs` for the static architecture checks. The targeted audits `audit-phase2020-controller-request-binding-interface-first.cjs`, `audit-phase1962-ast-classifier-adt-correlation-interface-first.cjs`, `audit-phase2013-invocation-outcome-uniformity-interface-first.cjs`, `audit-phase1838-controller-integrated-response-preservation.cjs`, `audit-phase1839-laravel-controller-scanner-interface-implementation.cjs`, `audit-phase1869-laravel-invocation-integrated-response-interface-first.cjs`, and `audit-phase2001-interface-driven-controller-response-runtime.cjs` passed after updating stale checks/documentation to the current version-26 scanner contract. The unrelated `audit-phase1384-runtime-contract-execution-boundary.cjs` returned 10/12, with two failures about the route producer canonical materialize API and legacy AST analyzer deprecation; these are outside this patch and are not reported as passing.

No build or typecheck is claimed.
