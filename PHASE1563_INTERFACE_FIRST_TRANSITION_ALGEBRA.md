# Phase 1563 — Interface-first request-type transition algebra

## Scope

This phase changes the upstream semantic contract only. Scanner code, authority implementation, runtime executor, and downstream projections remain unchanged. No package installation or build was run.

## Why the model needed another step

Phase 1562 made the group receipt carry the complete final `RequestType`, but the contribution ledger still described actions and response mostly as decision labels. It did not formally connect each contribution's prior state, incoming facts, and resulting state. In addition, a route disposition could be marked `contributed` while carrying an `unresolved_resource`, which contradicts the meaning of a successful contribution. Group keys were plain strings and could not express their resource identity domain at the type boundary.

## Contract changes

- Added `RequestTypeGroupKey = resource:${string}` to separate group/resource identity from route and request evidence-key domains.
- Narrowed `contributed` route dispositions to require a resolved `RequestTypeResourceEvidenceReference`. Missing resource evidence remains an explicit `unresolved` disposition instead of being embedded inside a successful contribution.
- Expanded each `RequestTypeGroupContributionReceipt` with `transition`, complete `before` state, incoming actions/response, and complete `after` state.
- Added type-level policy declarations for initial-group semantics, merge semantics, contribution-chain continuity, and equality between the final transition and the group output.
- Added laws for resolved-resource contributions, transition continuity, policy-conformant transitions, final output correspondence, and canonical group identity.
- Added distinct verification reasons for contribution-transition mismatch, policy mismatch, and invalid group key.
- Removed unused runtime policy/law/contract object constants from this upstream interface file; repository search found no consumers outside the file. The file now declares types and contracts without constructing runtime values.
- Applied `RequestTypeGroupKey` to group/resource relations and incompatible-group conflict identity.

## Trace findings preserved

`packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts` still chooses the first request lookup, silently skips missing requests, indexes aliases without an explicit duplicate-identity judgment, derives a lower-case group key directly, and merges actions/response locally. `RequestTypeDeriver.ts` still exposes `readonly RequestType[]` rather than the closed judgment. These remain migration targets, not changes in this phase.

`packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts` remains untouched. Runtime migration stays last.

## Validation

- `node scripts/audits/audit-phase1563-request-type-transition-algebra.cjs`: 23/23 static checks passed.
- SHA-256 comparison against the Phase 1562 workspace confirms the scanner aggregation file, scanner entrypoint, and runtime executor remain byte-for-byte unchanged.
- No full TypeScript check, package build, or Vitest run is claimed.

## Next architecture step

Before wiring scanner consumers, implement and verify an upstream authority that independently checks evidence inventory, identity uniqueness, route dispositions, contribution state transitions, relation closure, and output correspondence. Then wire the scanner to the verified judgment. Simplify the group aggregator after authority ownership is real. Migrate the runtime executor only after that contract is implemented and proven.
