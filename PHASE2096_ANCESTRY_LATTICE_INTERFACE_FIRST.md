# Phase 2096 — Ancestry Lattice Interface-First Contract

## Scope

This phase is intentionally interface-first. It does not alter scanner runtime, authority implementation, relation/foundation modules, or subscanner wiring.

## Trace finding

`ControllerDeclarationAncestryClosure` repeated the same lattice fields in both complete and partial branches. That repetition makes the algebraic model harder to maintain and can allow the two variants to drift. The existing authority also emits numeric `heightBound`, `rounds`, and `knownAncestors`; TypeScript does not establish their arithmetic invariants merely because the fields are typed as numbers.

## Change

- Added `ControllerDeclarationAncestryLatticeContract` as the shared type-level lattice contract.
- Kept complete and partial closure as distinct discriminated union members with different fixed-point claims.
- Added the contract to the upstream barrel export.
- Did not add runtime constants, reasoning rules, new executor functions, or duplicate semantic authorities.

## Limits

This consolidates the interface; it does not prove the implementation's transfer function is monotone, prove the inventory is finite/complete, or validate numeric witness relationships. Those require executable invariants and evidence at the authority boundary, which were deliberately not changed in this interface-only phase. Relation/foundation/subscanner dependencies remain and are not claimed retired.

## Verification

`node scripts/audits/audit-phase2096-ancestry-lattice-interface-contract.cjs` — 11/11 structural checks passed.

ZIP integrity checked. TypeScript build, typecheck, and Vitest were not run.
