# Interface Trace Audit Phase 75

## Scope
Interface/ADT only. Producer, scanner, mapper, lowerer, and consumer flow are intentionally unchanged.

## Trace finding
`base.ts` contained two semantic free-data sinks:
- `PagePropEntry.value: unknown`
- `PageMetaEntry.value: unknown`

`RouteManifest.frontend` also represented semantic absence with `FrontendConfig | null`.

## Repair
Introduced `PageValue`, a recursive closed ADT:
- string
- number
- boolean
- null literal
- list of PageValue
- object of named PageValue entries

The `null` variant is a literal value, not absence.

Introduced `FrontendConfiguration`:
- `disabled`
- `configured` with `FrontendConfig`

## Invariant
Canonical page data cannot enter the domain as `unknown`.
Frontend absence cannot enter the canonical manifest as JavaScript `null`.

## Deferred
Existing producers and consumers may still construct the former shapes. They are deliberately not migrated in this phase because the current work sequence is interface first, then flow.
