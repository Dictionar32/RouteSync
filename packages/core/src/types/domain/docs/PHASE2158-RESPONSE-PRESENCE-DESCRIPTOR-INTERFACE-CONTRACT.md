# Phase 2158 — Response Presence Descriptor Interface Contract

## Finding

The previous implementation used `matchResponse` inside `resolveControllerActionContract` to classify response presence. That visitor is an exhaustive dispatch mechanism, but it is not the semantic ownership contract. Three visitor arms independently rebuilt the same `response_present` judgment, while the `void` arm rebuilt `response_absent`.

## Change

- Added `ResponseDescriptorPresenceContract` as an explicit interface owned by the existing response descriptor contract.
- Evolved `ResponseDescriptorBase` to extend that interface.
- Each existing descriptor constructor now publishes its closed `semanticPresence` judgment at descriptor creation: `resource`, `model`, and `inline` publish `response_present`; `void` publishes `response_absent`.
- `resolveControllerActionContract` now consumes `response.semanticPresence`; it no longer dispatches over response variants or reconstructs the judgment.
- The exact same judgment continues to feed return semantics, controller dataflow, and `ControllerActionContract.semanticResponse`.
- Updated the Phase 2156 audit to assert the descriptor-owned interface instead of requiring `matchResponse` in the consumer.

## Architectural boundary

`matchResponse` remains available as a generic visitor for code that genuinely needs variant-specific behavior. It is not used as a substitute for this semantic contract. No new authority, `relation/foundation`, or subscanner was introduced.

## Validation

The phase-specific static audit checks interface ownership, all four descriptor variants, public exports, and reuse of the same judgment. Syntax-only transpilation is separate from full project type checking; full build, full typecheck, and Vitest are not claimed by this report.
