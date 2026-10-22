# Phase 2341 — Existing Policy Contract: Upstream Ownership

## Root cause

The existing effective-controller-action policy had an upstream ADT and resolver, but Laravel route scanning still invoked a scanner-local resolver. That left policy closure split between two semantic owners. The scanner contract also did not declare which policy executor it was required to use.

## Contract-first correction

- Evolved `EffectiveControllerActionPolicyUpstreamInput` with the existing domain-owned `EffectiveControllerActionPolicyCatalogEntry` contract. The upstream resolver now closes inherited class-scope relations from the typed catalog and excludes inherited method-scope relations.
- The existing upstream semantic authority and runtime executor are now concrete exported contracts/objects around the canonical upstream resolver. Executor delegates to authority and preserves its closed `complete | blocked` ADT.
- Evolved `LaravelRouteScannerInterface` to require `effectiveControllerActionPolicyExecutor`; scanner contract version is now 14.
- Scanner wiring delegates policy judgment through the injected executor and supplies the catalog already derived from controller action evidence.
- Added a regression test that parent class policy is inherited while parent method-only policy is not leaked into a child action.

## Flow

`ControllerActionFlowContract` → `EffectiveControllerActionPolicyCatalogEntry[]` + concrete action input → `EffectiveControllerActionPolicyRuntimeExecutorInterface.execute` → `EffectiveControllerActionPolicySemanticAuthorityInterface.judge` → `resolveEffectiveControllerActionPolicyUpstream` → closed policy ADT → `RouteSemanticFlow.controllerActionPolicy`.

## Explicitly unresolved

- The catalog is currently action-derived in scanner wiring. Completeness for inherited ancestors that do not publish actions still needs a stronger closed inventory judgment; an empty list must not be interpreted as proof of a complete empty inventory when `inheritedFrom` is non-empty.
- Source-model consumers still call the upstream resolver directly. They share the same resolver/algebra but do not yet consume the executor interface.
- Broader scanner wiring still imports `semantic/relations`; this phase does not claim those imports or legacy subscanner callers have been removed.
- AST/manifest projection and CLI end-to-end preservation have not been verified.

## Verification limits

Static source audit and ZIP integrity are checked. Vitest, TypeScript typecheck, package build, and CLI end-to-end were not run. `npm run build` was not run.
