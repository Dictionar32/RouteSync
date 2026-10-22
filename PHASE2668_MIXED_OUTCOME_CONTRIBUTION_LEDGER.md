# Phase 2668 — Mixed-outcome contribution ledger

## Root-cause findings

The semantic producer previously returned `groups: []` whenever any route/request/resource conflict or unresolved route existed. That erased independently valid route contributions even though the same judgment carried route, request, and resource receipts. In addition, the active source referenced `makeProof(...)` without defining it, and imported `actionContribution` from the parent directory even though the module lives beside the producer. The latter is a direct module-resolution failure, not merely an audit gap.

## Source repair

- Corrected the source import to `./actionContribution`, matching the actual module location.
- Added one `makeProof` producer. It binds proof source evidence to the canonical prepared inventory, carries the exact upstream policy and required-law map, and derives relations from the same route/resource/request/group receipts published in the proof.
- Conflict judgments now fold contribution-eligible routes and expose `groups` from their `groupReceipts`, while preserving the non-empty conflict ledger and `conflicted` closure.
- Incomplete judgments do the same for resolved routes while preserving the unresolved witness ledger and `incomplete` closure.
- The group fold remains delegated to `requestTypeDerivationGroupContributionAlgebra`; the producer does not locally rewrite action/response merge policy.
- Unsupported response contributions still fail with `RequestTypeDerivationSemanticProducerGapError`; no fallback `RequestType[]` path is introduced.

## Source path

`CLI scan/sync → manifest composition → upstream semantic pipeline → canonical source inventory → request/resource resolution ledgers → route dispositions → contribution-eligible route fold → group receipts → conflict/incomplete/derived judgment → proof relations`.

## Laravel source grounding

Laravel's `Router::resource` delegates registration to `ResourceRegistrar`, while `RouteCollection` indexes routes by method/URI and maintains name/action lookups. This supports keeping route occurrence identity separate from request and resource identities, and only correlating them through source-backed resolution evidence.

- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/Router.php
- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/ResourceRegistrar.php
- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/RouteCollection.php
- https://laravel.com/framework/docs/13.x/routing

## Verification status

The Phase 2668 audit is a structural source audit, not proof of runtime correctness. Phase 2665/2666/2667 structural audits pass. Full TypeScript typecheck could not run: the workspace has no installed dependencies, and the globally available TypeScript compiler is older than the project's configured target/lib and cannot find `@types/node` or `vitest/globals`. Runtime tests, CLI/Laravel fixtures, and all 34 semantic proof laws remain unverified.
