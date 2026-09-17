# RouteSync Interface Trace Audit - Phase 71

## Scope
Interface/domain contract repair only. Producer and flow migration is intentionally not included.

## Trace Finding
The previous phase removed nullable absence from validation rules, but the domain still represented absence with `null` in three semantic boundaries:

1. HTTP request content type: `mimeType` and `headerExpression`.
2. Authentication security scheme: `defaultHeaderName`.
3. Route parameter binding: `bindingField`.

These values are not arbitrary nullable data. Each has a finite semantic state space.

## Repair
- `RequestMimeType`: `json | multipart | urlencoded | none`.
- `RequestHeaderExpression`: `content_type | none`.
- `AuthorizationHeaderName`: `authorization | none`.
- `RouteBindingField`: `convention | explicit`.

## Invariant
Absence is represented as a domain state, not JavaScript `null`.

A downstream consumer can pattern-match the state without guessing whether `null` means “not applicable”, “not scanned”, “default”, or “missing”.

## Intentionally Deferred
Existing factories, registries, scanners, and flow code still construct the old shapes. Their compile errors are expected at this interface-first stage. Migrating those producers belongs to the next stage and is not silently mixed into this repair.

## Validation
Added `interface-contract-phase-71.test.ts` to lock the new type contracts.
