# Phase 2672 — Resource group identity verification

## Root cause

Phase 2671 independently checked route-derived action/response content and source provenance, but did not bind the final `RequestTypeGroupReceipt.canonicalKey` to the resource-resolution witness for every contributing route. An authentic route/request receipt could therefore be assigned to the wrong resource group.

## Implementation

- Added the upstream port `RequestTypeDerivationGroupIdentityVerificationInterface`.
- Implemented `requestTypeDerivationGroupIdentityMatchesInput` in `requestTypeDerivationProofVerifier.ts`.
- Every group key must be domain-separated with `resource:` and match the resolved resource's canonical identity in exactly one `resourceResolutionLedger` entry for each contributing route.
- Every contributing route must have exactly one request-resolution receipt, and its resolved request occurrence must match the contribution's request reference.
- Duplicate route occurrences across groups and duplicate group keys are rejected.
- Reusing the same FormRequest occurrence across distinct routes is allowed when each route's own resolution receipt points to that request. A global request-uniqueness rule would be incorrect because Laravel applications may legitimately reuse a FormRequest class across routes.
- The final verification gate requires this identity check in addition to group replay, source/provenance correlation, and AST action/response correlation.

## Tests added

`requestTypeDerivationGroupIdentityVerification.phase2672.test.ts` covers:
- valid resource-group identity;
- forged canonical group key;
- duplicated route occurrence across groups;
- missing or duplicated resource-resolution receipts;
- legitimate shared FormRequest occurrence across distinct routes.

## Audit results

- Phase 2671 AST contribution replay audit: 12/12 structural assertions passed.
- Phase 2670 source-bound incoming receipts audit: 10/10 structural assertions passed.
- Phase 2671 AST contribution replay audit: 12/12 structural assertions passed.
- Phase 2672 resource group identity audit: 19/19 structural assertions passed after adding assertions for the runtime test cases.
- All seven available audits from Phase 2665 through Phase 2672 passed: 72/72 structural assertions in total.
- Laravel `Router`, `ResourceRegistrar`, and `RouteCollection` were consulted as upstream references for route registration, resource action expansion, and the separation of route/name/controller-action lookups.

## Verification limitations

The environment has no project `node_modules`, no `vitest` dependency, and no `examples/ecommerce-shop-source/vendor/autoload.php`. The Vitest cases and Laravel runtime scan were therefore not executed. A global `tsc --noEmit` attempt failed before project checking because the installed compiler could not resolve the repository's configured standard libraries, `@types/node`, and `vitest/globals`, and rejected the repository's configured target/lib values. Do not interpret source audit passes as a successful build.

The 34 canonical semantic laws remain `verification_incomplete`. The final decision → authority → integrity → manifest path and full end-to-end `scan`/`sync` still need runtime verification.
