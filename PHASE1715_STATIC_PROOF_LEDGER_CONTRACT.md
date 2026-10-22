# Phase 1715 — Static Invocation Proof-Ledger Interface Contract

## Scope

This phase continues interface-first work on the upstream static invocation semantic model. It adds an explicit proof-ledger contract; it does not implement static invocation algebra, the authority validator, or scanner wiring.

## Trace and correction

Phase 1714 defined admissible target/binding/effect/aggregate combinations. The next gap is proof integrity: a type could still carry duplicate obligation identities, omit a rule witness, include a witness for a non-applicable rule, or provide an evidence ledger that does not correlate with the judgment. The authority interface now owns a dedicated `InvocationStaticSemanticProofLedgerContract` describing canonical witness order, witness applicability, exact subject binding, unique obligation identities, ordered proof/judgment ledger equality, evidence lineage, and separate closure laws.

The authority violation ADT gains explicit codes for missing applicable witnesses, non-applicable witnesses, invalid proof/obligation ordering, and duplicate obligation identities. These are rejection outcomes, not instructions to repair or reclassify a judgment.

## Interface changes

- Added `InvocationStaticSemanticProofLedgerContract` and `INVOCATION_STATIC_SEMANTIC_PROOF_LEDGER_CONTRACT` in `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`.
- Attached the ledger contract to static authority validation, aggregate judgment, static judgment model, source coverage, and the top-level invocation pipeline contract.
- Advanced authority validation contract to v3, aggregate judgment to v6, static model and coverage to v10, and pipeline to v23.
- Updated the authority validation receipt to identify contract version 3.
- Exported the contract and type through `packages/core/src/index.ts`.
- Updated regression audit expectations and added `scripts/audits/audit-phase1715-static-proof-ledger-contract.cjs`.
- Did not change production scanner wiring or introduce `semantic/foundation` dependencies.

## Verification

- Phase 1715 audit: 14/14 checks passed.
- Regression audits Phase 1702–1715: 218/218 checks passed.
- Targeted strict TypeScript validation of `invocationSemanticPipelineInterface.ts`: PASS, zero diagnostics.
- Full package build: not run.

## Remaining work

Static invocation is still explicitly uncovered by the production judgment algebra. Next interface-first step is to define the algebra output/authority input boundary and then implement a validator that enforces this ledger. Only after that should scanner wiring delegate to the authority.
