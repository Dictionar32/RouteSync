# Phase 2544 — Source-Occurrence Resolution Alignment

## Root cause

The request-resolution inventory associated each route with `inventory.routes` using `slice(index, index + 1)`. That silently assumed the route input and evidence inventory were in the same order. The inventory is semantically identified by canonical source-occurrence keys, not array position; positional alignment could attach a valid-looking receipt to the wrong route if the two collections were reordered or otherwise diverged.

## Implementation

- The resolver now obtains the route evidence by calling the existing upstream `canonicalRouteOccurrenceKey(route.provenance)` operation and matching `occurrenceKey`.
- It requires exactly one evidence receipt for that source occurrence. Missing or duplicate matches fail closed instead of silently selecting a positional candidate.
- The route-binding ADT remains exhaustive, including explicit `unresolved_request` and `unresolved_action_request` outcomes.
- No duplicate identity helper was introduced; canonical occurrence identity remains owned by the existing upstream inventory.
- No `semantic/foundation` or `semantic/relations` dependency was added.

## Verification

- `audit:phase2544-source-occurrence-resolution-alignment`: 6/6 structural assertions.
- Phase 2543 preflight audit and the existing identity/resolution audits are run separately.
- Full typecheck, package build, and end-to-end CLI tests are not claimed by this phase.

## Scope boundary

This fixes the source-evidence association bug in the request-resolution ledger. It does not implement the missing semantic reasoning producer, the complete 32-law proof verifier, or the authority-backed CLI cutover. The active `RequestType[]` solver remains a known architectural gap.
