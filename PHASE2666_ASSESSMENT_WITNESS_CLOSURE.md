# Phase 2666 — Assessment / judgment witness closure

## Root cause

The request-type judgment ADT requires `incomplete.unresolved` to be a non-empty tuple, but the semantic producer previously cast an arbitrary array into that tuple. The branch could also be entered because a preparation assessment said `incomplete`, even when route receipts contained no unresolved disposition. That would manufacture a shape-level claim without a route-level witness and could produce a closure count of zero for an `incomplete` judgment.

## Source repair

`requestTypeDerivationSemanticReasoning.ts` now names the assessment condition explicitly and rejects inconsistent preparation packets with `RequestTypeDerivationSemanticProducerGapError` if the assessment claims incompleteness but no unresolved route receipt exists. The non-empty tuple assertion is reached only after the runtime witness-count check. It does not silently relabel the result as derived or invent a witness.

## Path relationship

`CLI → manifest composition → upstream semantic pipeline → source inventory / resolution ledgers → route receipts → assessment-witness guard → semantic judgment ADT → proof closure`.

This phase repairs one producer/ADT mismatch; it does not close mixed conflict contribution receipts, the full 34-law verifier, decision/authority/integrity, or all Laravel response projections.

## Laravel source grounding

Laravel's `Router::resource` delegates route construction to `ResourceRegistrar`; route-model binding separately supports implicit parameter-name matching and explicit `Route::model` / `Route::bind` mappings. RouteSync must retain route, request, and resource identities as separate source domains until the resolution ledger proves a relation.

- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/Router.php
- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/ResourceRegistrar.php
- https://github.com/laravel/docs/blob/13.x/routing.md

## Verification boundary

The audit is structural only. The closure implementation now derives `accounted` from unique source occurrence keys actually present in route/resource/request receipts, rather than copying inventory lengths into both `expected` and `accounted`. A `closed` closure throws a typed producer-gap error if any domain is not fully covered.

Full typecheck, Vitest, CLI end-to-end with Laravel fixtures, and complete proof-law verification remain unverified in this workspace snapshot.
