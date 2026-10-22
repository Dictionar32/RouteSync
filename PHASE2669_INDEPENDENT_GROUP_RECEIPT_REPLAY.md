# Phase 2669 — Independent group receipt replay

## Source-level root cause

Phase 2668 preserved mixed-outcome group contributions, but the verifier still failed closed for every non-conflict slice and had no independent replay of `before → incoming → after`. The group receipt contract already carried enough action/response transition data to verify a meaningful slice without calling the producer's fold algebra. It did not carry the incoming `RequestType` identity/source in full, so this slice cannot verify every group/source identity law.

## Implementation

- Added `requestTypeDerivationGroupReceiptsReplay` in `requestTypeDerivationProofVerifier.ts`.
- The verifier replays action merge policy and response retention/acceptance directly from the canonical upstream contract, without invoking `requestTypeDerivationGroupContributionAlgebra.fold`.
- It checks the first `group_absent` transition, subsequent `before === previous.after` continuity, route/request contribution order, receipt action/response classifications, final `after === group.result`, `resultIdentity === result.identity`, and equality between receipt results and judgment groups.
- Added a distinct `verification_incomplete` result: `group_contribution_replay_confirmed`. It keeps all 34 law IDs in `missingLaws`; it is explicitly not `valid`.
- Added tests for a valid two-step replay and a forged after-state that repeats its forged value as the group output. The latter must fail, demonstrating that comparing only final output with the receipt is insufficient.
- Kept the duplicate-identity ledger check as a separate partial verification path. Empty group lists cannot vacuously claim that group replay was verified.

## Active path

`CLI scan/sync → manifest composition → upstream semantic pipeline → prepared AST/inventory → resolution ledgers → semantic judgment → proof group receipts → independent receipt replay → incomplete verification envelope → authority coverage gate → decision/authority/integrity → manifest`.

## Laravel source grounding

Laravel 13.x `Router::resource` delegates to `ResourceRegistrar`; `ResourceRegistrar` expands a resource into action-specific route registrations, and `RouteCollection` separately indexes by method/URI, route name, and controller action. Route occurrence identity therefore cannot safely be inferred from a controller action or route name alone.

- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/Router.php
- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/ResourceRegistrar.php
- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/RouteCollection.php

## Verification status and remaining source gap

- Static structural checks below confirm the expected source anchors and no producer-algebra import in the independent replay function.
- Runtime Vitest and full typecheck remain unverified because project dependencies are not installed in this workspace.
- This is not a 34-law verifier. The current group contribution receipt's `incoming` stores only `actions` and `response`, not the full incoming `identity` and `source`. To verify source identity and group-key laws independently, evolve the upstream receipt interface to include a full source-bound incoming value or a canonical incoming identity/source witness; do not reconstruct it from the producer's `after` output.
- The verifier still does not independently verify every source inventory, route/resource/request resolution, closure, invalid-input counterexample, or all duplicate-occurrence laws. Those remain explicit producer gaps.
