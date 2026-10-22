# Phase 1972 — Policy Scope Closed Judgment, Interface First

## Objective

Repair the root modeling defect identified in Phase 1971: the existing scope authority could turn unsupported `only` / `except` expressions into an apparently valid empty action list. The fix must start in the upstream semantic contract and preserve the blocked judgment through downstream projection. No `relation` or `foundation` subscanner is introduced.

## Trace findings

1. `ControllerPolicyActionScopeJudgmentInterface.analyze` returned `ControllerPolicyActionScope` directly, so there was no outcome for evidence that could not be interpreted statically.
2. The prior authority filtered non-string entries out of arrays and returned an empty action sequence for unsupported expressions. That confused “proven empty scope” with “scope not understood”.
3. Duplicate named `only` / `except` arguments were reduced to the first match.
4. `RouteMiddlewareFlow` had no judgment status, so a blocked scope could be filtered out and look like a valid empty effective middleware result.
5. Effective policy projection could emit middleware / authorization facts even when the scope interpretation was not closed.

## Changes

- Evolved the existing `ControllerPolicyActionScopeJudgmentInterface` to return `ControllerPolicyActionScopeJudgment`.
- Added typed block reasons to the existing controller domain model: duplicate scope arguments, unsupported direct expressions, unsupported array entries, unpacked arguments, and inconsistent evidence inventory.
- Reworked the existing authority to preserve source argument evidence and return a blocked outcome instead of silently filtering unsupported entries.
- Preserved a genuinely empty literal array as a resolved empty scope. This is distinct from a dynamic expression or an array containing unsupported entries.
- Propagated blocked scope through `ControllerPolicyRelation`, `RouteMiddlewareScope`, `RouteMiddlewareFlow.judgment`, and `EffectiveControllerActionPolicy.judgment`.
- Added `controller_action_policy_blocked` and `route_action_policy_blocked` semantic relations so the high-level source model can preserve a blocked judgment instead of projecting partial policy as complete.
- Added regression tests for dynamic expressions, duplicate arguments, empty literal arrays, unpacked arguments, and blocked route middleware flow.
- Exported the judgment and reason types through the existing upstream entrypoints.

## Semantic invariants

- Unsupported scope evidence never becomes `all`, `only: []`, or `except: []` by omission.
- A statically empty array remains a valid empty scope; empty is not synonymous with unknown.
- Both `only` and `except` are preserved when both are present.
- Duplicate `only` or `except` arguments block the judgment instead of selecting the first one.
- Downstream consumers can distinguish `complete` from `blocked`; an empty effective list alone is not treated as proof of completeness.
- The runtime scanner only carries the authority result into controller and route policy projection; the semantic interpretation is owned by the existing upstream authority.
- No `relation` or `foundation` subscanner is added.

## Validation boundary

The Phase 1972 audit is structural. It checks the contract, authority, propagation types, tests, and forbidden subscanner paths. It does not prove TypeScript compilation or runtime test success. Build and test runner were intentionally not run in this environment.
