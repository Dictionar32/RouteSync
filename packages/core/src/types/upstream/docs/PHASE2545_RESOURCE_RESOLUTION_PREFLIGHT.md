# Phase 2546 — Route/Binding Resource Identity Alignment

## Root cause

The resource preflight previously resolved `route.identity.domain.resource`, while the legacy RequestType grouping key is derived from `route.binding.request.identity.resource`. Those values usually agree, but the preflight did not enforce that invariant. A route could therefore pass resource resolution for one resource and later be grouped under another.

## Implementation

- The existing resource-resolution ADT now includes `identity_mismatch`, carrying both source resource names.
- For `form_request` routes, the inventory compares both values through the canonical upstream resource identity operation before resolving the binding resource.
- A mismatch is retained as a conflict receipt and blocks CLI `scan`/`sync` through the existing resource assessment gate.
- Non-FormRequest bindings retain the existing `not_required` disposition because this FormRequest-specific derivation path does not contribute a FormRequest descriptor for those variants.
- No `semantic/foundation` or `semantic/relations` dependency was added.

## Remaining boundary

This closes resource-identity alignment at preflight. It does not implement the complete RequestType semantic producer, the verifier for all 32 laws, or the authority-backed CLI cutover.
