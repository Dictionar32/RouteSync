# Phase 753 — Highest Form Request Semantic Authority

## Build frontier

The authoritative local build reported a DTS failure in `formMapperBuilder.ts` because the mapper still consumed the removed legacy projections `RequestType.resourceName` and `RequestType.formTypeName`, while `RequestType` had already been raised to the canonical identity ADT.

The failure was treated as an interface-authority violation, not as a request to restore the removed fields.

## Structural correction

`RequestType` is consumed only through its canonical semantic identity:

- `requestType.identity.resource` is the authoritative Laravel resource identity.
- `requestType.identity.source.formType` is the authoritative Laravel FormRequest-derived form type.
- the generated contract name is derived from the canonical resource identity instead of being passed as a duplicate descriptor.
- form action traversal uses the relation projection algebra.
- nested request-field selection/projection uses relation selection/projection rather than host `filter`/`map` traversal.
- the unused `extractObjectPropertyNames` reservoir was removed after repository reference audit showed no consumer.

## Boundary principle

The mapper now follows:

`Laravel FormRequest evidence -> RequestType identity ADT -> relation traversal -> target projection`

It does not reconstruct request identity from legacy scalar fields.

## Audit

`npm run audit:phase753-form-request-semantic-authority` passes with all checks true.

The audit verifies canonical identity consumption, relation-backed traversal, removal of legacy request projections, removal of the unused extraction reservoir, and absence of forbidden host constructs in the changed semantic mapper sources.

## Build verification

The full `npm run build` has not been executed inside this checkpoint workspace because the checkpoint does not contain the user's local dependency installation. The local build supplied by the user remains authoritative; after this structural change, run `npm run build` in the original workspace to expose the next DTS frontier.
