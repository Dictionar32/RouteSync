# Phase 2667 — Receipt-derived inventory closure repair

## Root cause

The previous closure producer assigned `accounted = inventory.length` for routes, resources, and requests. That made closure counts a restatement of expected counts rather than evidence that the source inventory had corresponding receipts. A missing or duplicate receipt could be hidden by the closure constructor.

## Implementation

- `closureCounts` calculates expected counts from the canonical inventory and accounted counts from unique receipt occurrence keys that match that inventory.
- Route, resource, and request receipt domains remain separate.
- Conflict and incomplete closures carry measured coverage; they do not claim all inventory items were accounted for by construction.
- A `closed` closure is emitted only when each domain's measured coverage equals its expected inventory count. Otherwise the producer fails with `RequestTypeDerivationSemanticProducerGapError` and reports the domain counts.
- Phase 2666's assessment-witness guard remains in place: an `incomplete` ADT cannot be created without a non-empty unresolved route receipt ledger.

## Source path

`CLI → manifest composition → upstream pipeline → source inventory → request/resource resolution ledgers → route/request/resource receipts → measured closure → semantic judgment ADT`.

## Laravel boundary

Laravel resource registration is framework-produced through `Router` / `ResourceRegistrar`; implicit and explicit route-model binding are separate resolution mechanisms. RouteSync should preserve these as distinct source domains and only correlate them through explicit resolution evidence.

Official references:
- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/Router.php
- https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/ResourceRegistrar.php
- https://github.com/laravel/docs/blob/13.x/routing.md

## Verification status

Structural audit assertions can verify source wiring but cannot establish runtime correctness. Typecheck, build, Vitest, CLI/Laravel fixture execution, and all request-type derivation proof laws remain unverified in this snapshot because dependencies are not installed.
