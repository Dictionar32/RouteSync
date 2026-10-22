# Phase 2160 — Response Reference Judgment Interface-First

## Changes

- Replaced the controller response-reference ADT discriminants `response_present` / `response_absent` with `response_reference_declared` / `response_reference_not_declared`.
- Added the precise `ControllerResponseReferenceJudgment` type. Kept `ControllerResponse` as a compatibility alias so the public type name can migrate without duplicating the ADT.
- Evolved response descriptor contract to `ResponseDescriptorReferenceContract` and `responseReferenceJudgment`; kept `ResponseDescriptorPresenceContract` as a compatibility alias.
- Renamed the action contract and published action semantic knowledge field from `semanticResponse` / `response` to `responseReferenceJudgment`.
- Updated the existing resource-binding authority to consume the precise reference judgment and report `response_reference_not_declared` as unresolved instead of implying no HTTP return.
- Preserved integrated response evidence as two distinct inputs: observed PHP return expressions and descriptor response-reference candidates.
- Updated related contract versions and historical audits. No new authority, `relation/foundation`, or subscanner was added.

## Remaining work

`resolveControllerActionContract()` still calls `resolveResponse(...)` to build the descriptor from method/attribute evidence. This phase clarifies the semantic contract boundary but does not claim the legacy response derivation has been retired or that the complete action judgment is closed.

## Validation

- Phase 2160 static audit: 15/15.
- Phase 2158 regression audit: 13/13.
- Phase 2159 CLI trace audit: 14/14.
- Syntax-only TypeScript transpilation: 18 files, 0 syntax diagnostics.
- Full build, full typecheck, and Vitest were not run.
