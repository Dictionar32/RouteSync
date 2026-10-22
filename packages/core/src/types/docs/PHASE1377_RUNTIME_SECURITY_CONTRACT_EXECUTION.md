# Phase 1377 — Runtime Security Contract Execution

## Finding

`RouteSecurityClassifier` in the domain layer duplicated middleware classification already owned by `routeSecurityAuthority`. That made the domain facade a second semantic decision path rather than a runtime executor of the upstream contract. The upstream authority also extracted middleware payloads incorrectly by taking a zero-length prefix instead of locating the `:` separator.

## Change

- Introduced `RouteSecurityAuthorityAlgebraInterface` and a closed `RouteSecurityAuthorityContractInterface` with explicit `authority: upstream` and `closed: true`.
- Bound the production `routeSecurityAuthority` through `createRouteSecurityAuthority(routeSecurityAuthorityAlgebra)`. The wrapper delegates `resolve` to the injected algebra and does not classify middleware itself.
- Converted `RouteSecurityClassifier.classify` into a backward-compatible facade over `routeSecurityAuthority.resolve(middleware).security`; removed the duplicate classifier state machine.
- Corrected middleware payload extraction to locate the actual colon separator, preserving ability/role values after prefixes.
- Added a focused static audit covering contract shape, authority composition, runtime wiring, duplicate-classifier removal, and build-script stability.

## Contract flow

`RouteMiddleware` ADT → `RouteSecurityAuthorityAlgebraInterface` → canonical upstream security/policy reasoning → closed `RouteSecurityAuthorityInterface` → scanner wiring / compatibility facade → downstream projection.

## Validation boundary

The phase audit and architecture/semantic-ownership audits are static source checks. A full TypeScript build and runtime tests must be run in an environment with the repository's declared dependencies installed.
