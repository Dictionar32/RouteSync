# Phase 1317 — Payload Location Evidence Contract

Date: 2026-10-08

## Trace finding
`payloadLocation` was closed upstream, but the contract retained only the scalar (`query`/`body`/`none`). The consumer could use the result, yet audits could not distinguish an explicit boundary override from the legacy HTTP-method convention. This hid evidence quality and made the fallback look like a source fact.

## Change
- Introduced `RoutePayloadLocationDecision`, a closed decision algebra.
- Explicit boundary values are tagged `explicit_boundary`.
- The compatibility convention is tagged `http_method_fallback_policy`, with the method and named policy preserved.
- Kept `payloadLocation` as a projection of `payloadLocationDecision.location` to avoid changing SDK/React/CLI transport APIs.
- Carried the same decision through `ResolvedRouteCapability`, boundary wiring, `RouteCapabilityContract`, and route descriptor projection.
- Added a regression audit and preserved all existing package scripts.

## Ownership invariant
The method convention is still a fallback policy, not stronger semantic evidence. It remains upstream-only and is now explicit/auditable. A future source-evidence migration can replace that policy without changing downstream consumers. Do not claim the fallback has been eliminated.

## Validation
Targeted static audits and archive integrity are checked. The full TypeScript build is not claimed unless the repository's configured `tsdown` build completes.
