# Phase 1539 — Derivation-Closed Semantic Dataflow Interface

## Goal

Strengthen the existing semantic-dataflow admission interface so a closed judgment cannot be admitted solely because its facts and derivation references are structurally present. The contract now requires derivation coverage for every closure fact and validates the known derivation rule shapes.

## Changed files

- `packages/core/src/types/upstream/semanticDataflow.ts`: adds `derivationCoverage` to `SemanticDataflowClosureCertificate`.
- `packages/core/src/types/upstream/semanticDataflowAuthority.ts`: binds the certificate coverage count to the generated closure length.
- `packages/core/src/types/upstream/semanticDataflowInterface.ts`: validates derivation identities, canonical fact derivations, reach-seed derivations, transitive reach derivations, and complete closure-fact coverage.
- `packages/core/src/types/upstream/__tests__/semantic-dataflow-interface-contract.phase910.test.ts`: updates the contract fixture.
- `scripts/audits/audit-phase1539-derivation-closed-interface.cjs`: adds static checks for the contract.
- `package.json`: registers `audit:phase1539-derivation-closed-interface`.

## Authority flow

`Source Evidence → SemanticDataflowAuthority → Judgment + Derivation Coverage → Interface Admission → Scanner Projection`

The interface validates proof structure and rule shape; it does not derive facts, rerun the solver, or repair judgments. The upstream authority remains the only owner of semantic derivation.

## Limits

This verifies the supported derivation rule shapes and closure coverage, not a formal proof that the entire relation calculus is complete or that the fixed-point algorithm is mathematically sound for every possible input. Full build/type-check remains dependent on the repository's configured toolchain.
