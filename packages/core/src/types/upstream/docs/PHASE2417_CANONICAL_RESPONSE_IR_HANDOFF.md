# Phase 2417 — Canonical Response IR Handoff

## Audit and trace

The route boundary already carries the canonical `EndpointResponseBinding` ADT. For controller methods, `controller_method_response` carries the exact `LaravelControllerMethodResponseProduct`, whose `result` is the existing `ResponseResult` ADT. Phase2416 improved one resource consumer, but the endpoint IR helper still classified `route.binding.response.kind` and reconstructed the older five-arm response reference. That made the IR helper read the compatibility descriptor instead of the selected upstream response judgment.

## Root cause

The IR response contract could represent only legacy resource/collection/paginated/custom/empty projections. It had no arm to preserve the method-correlated Integrated Response product and no explicit blocked arm. The helper therefore could not faithfully pass the upstream response contract through its boundary.

## Changes

- Extended the existing `ResponseReference` ADT with `integrated_response`, carrying the exact existing `LaravelControllerMethodResponseProduct` without conversion.
- Added an explicit `blocked` arm carrying the exact existing `controller_response_projection_blocked` judgment.
- Added arms that preserve each other existing `EndpointResponseBinding` variant: `declared_response`, `inline_response`, `redirect_response`, `file_response`, and `empty_response`.
- Changed `buildResponseReference` to switch on `route.binding.responseProjection`, not `route.binding.response`.
- Removed the legacy response-kind relation classifier from this handoff. No new semantic authority was introduced, and unsupported canonical variants are not normalized to `void` or `empty`.

## Technical references reviewed

- TypeScript Handbook: discriminated unions and narrowing explain why the shared literal discriminant preserves variant-specific payloads and supports exhaustive handling: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Laravel HTTP response documentation lists materially different response forms (JSON, redirects, files, streamed responses, and no-content), supporting the decision not to flatten distinct response semantics into one descriptor: https://laravel.com/framework/docs/12.x/responses

## Validation evidence

- `audit-phase2417-canonical-response-ir-handoff.cjs`: 13/13 assertions passed.
- Prior regression audits: Phase2416 8/8 and Phase2415 14/14 passed.
- TypeScript `transpileModule` syntax check: both modified production files passed with zero syntax diagnostics.
- A targeted TypeScript typecheck was attempted with global TypeScript 5.8.3. It failed with 61 existing project errors in other files; none of the diagnostics named either modified production file. This is not a successful project typecheck.
- Vitest, package build, and live CLI scan/sync were not run.

## Scope boundary / remaining work

This phase closes the `EndpointResponseBinding` → endpoint IR handoff contract. It does **not** claim the complete runtime executor or CLI pipeline has been validated. The separate legacy `RouteBindingContract.response` consumers, including response status/error-contract construction and the older route-response shape extractor, remain to be migrated or explicitly scoped as compatibility-only. Runtime consumers of the expanded endpoint IR union also need end-to-end integration tests before this can be called a full chain closure.
