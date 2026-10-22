# Phase 2601 — RequestType law obligation closure

## Purpose

The canonical RequestType derivation contract already names 34 laws, but the law IDs alone do not tell a verifier which concrete witness each law must establish. This phase adds `REQUEST_TYPE_DERIVATION_LAW_OBLIGATIONS` next to the canonical law set and gives each law a closed `RequestTypeDerivationLawWitnessKind` plus a proof-obligation domain. The registry is exported through the core public API.

## Ownership

- Canonical law IDs and obligation metadata: `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.
- Public export: `packages/core/src/index.ts`.
- Existing source-evidence inventory and partial source-occurrence verifier remain in `packages/core/src/compiler/semantic/request-type-derivation/`.
- The registry is descriptive contract metadata. It is not a producer, a verifier, or a substitute for proof evidence.

## Root cause addressed

Before this phase, the canonical law union was explicit, but the obligation-to-witness mapping was implicit in law names, policy fields, judgment/proof structures, and partial verifier logic. That makes it easy for an implementation to claim coverage without an explicit witness requirement for every law. The new mapped `Record<RequestTypeDerivationLawId, RequestTypeDerivationLawObligation>` forces one entry for every canonical law at the TypeScript contract boundary and the audit checks no law is omitted or added accidentally.

## Remaining production gap

This phase does **not** close the semantic production path. There is still no concrete production `RequestTypeDerivationSemanticReasoningInterface` implementation and no independent verifier that proves every one of the 34 laws. `RequestTypeDerivationSourceOccurrenceVerification` is a partial guard that delegates remaining checks; it must not be promoted to a complete verifier. The production composition root and real CLI end-to-end validation remain blocked on those capabilities.

## Validation

Run `node scripts/audits/audit-phase2601-request-type-law-obligation-closure.cjs`. This structural audit verifies the canonical 34-law set, one-to-one obligation mapping, closed witness-kind union, public export, and explicit non-claim about verification. It does not replace typecheck, package build, unit tests, or Laravel integration tests.
