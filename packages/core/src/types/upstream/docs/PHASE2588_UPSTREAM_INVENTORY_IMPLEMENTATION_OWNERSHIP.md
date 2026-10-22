# Phase 2588 — Upstream Inventory Contract / Implementation Ownership

## Scope

This phase fixes one concrete ownership leak in the active CLI → manifest → semantic RequestType path. It does not claim to make the entire `types/upstream` directory type-only, and it does not claim a production RequestType judgment producer exists.

## Root cause

`RequestTypeDerivationSourceEvidenceInventoryInterface` is the correct upstream contract, but its runtime implementation was also stored in `packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts`. That placed executable identity/inventory operations in the directory that the architecture reserves for upstream semantic types/contracts. It also made scanner preflight and semantic consumers import implementation code from the contract owner.

## Change

- Kept `RequestTypeDerivationSourceEvidenceInventoryInterface`, canonical identity ADTs, and source occurrence-key contracts in `requestTypeDerivationInterface.ts`.
- Moved the runtime inventory implementation to `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts`.
- Rewired request/resource resolution, source-occurrence verification, resolution inventory, resource-resolution inventory, and manifest request-resolution preflight to the implementation owner.
- Removed the implementation from `types/upstream/index.ts` and changed the public `packages/core/src/index.ts` export to point at the implementation module, preserving the named public operations.
- Updated the Phase 2584 trace audit to follow the new ownership boundary.

No new identity interface, semantic authority, legacy solver, `semantic/foundation`, `semantic/relations`, or subscanner dependency was added.

## Verification

- Phase 2588 ownership + syntax audit: 24/24 assertions passed.
- Phase 2584 CLI/manifest/upstream trace audit: 15/15 assertions passed; it continues to explicitly report the missing production semantic producer/verifier blocker.
- Phase 2585 integrity export audit: 11/11 assertions passed.
- Phase 2586 integrity-gate audit: 23/23 assertions passed.
- Phase 2587 legacy RequestType path retirement audit: 16/16 assertions passed.
- Phase 2583 CLI composition factory audit: 11/11 assertions passed.

These are structural checks and TypeScript syntax transpilation, not a successful project typecheck, Vitest run, package build, or live CLI execution.

## Remaining root blocker

The active CLI correctly fails closed without a supplied semantic pipeline. The repository still lacks a concrete production source-evidence → closed RequestType judgment/proof producer and an independent verifier that establishes all 34 canonical laws. The retired legacy solver is not restored or wrapped in a fabricated proof. The wider `types/upstream` tree also still contains other runtime implementations; this phase migrates only the source-evidence inventory operation needed for this path.

## Laravel routing implication

The scanner must derive route-file inventory from the target application's `bootstrap/app.php` configuration. Laravel's routing documentation states that default route files are loaded based on `bootstrap/app.php`, and custom route groups can be registered via `withRouting(... then: ...)` or complete registration can be supplied via `using`. Therefore, assuming only `routes/web.php` and `routes/api.php` is not a valid universal source inventory policy.
