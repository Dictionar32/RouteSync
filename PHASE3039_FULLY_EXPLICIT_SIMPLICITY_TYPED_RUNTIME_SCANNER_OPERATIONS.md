# Phase 3039 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Goal

Preserve the difference between “there are no mod/ref relations” and “mod/ref relations have not been derived”. The prior `modRefs: []` represented both states identically and could make a partially modeled domain look complete.

## Runtime change

- `SemanticObjectIdentityAnalysis.modRefs` is now `SemanticModRefAnalysis`, a closed ADT:
  - `mod_ref_evidence_derived` carries derived relations.
  - `mod_ref_evidence_not_derived` carries the explicit reason `mod_ref_domain_rules_not_implemented`.
- `SemanticObjectIdentityOperationsInterface.modRefEvidence()` owns the current outcome.
- `semanticObjectIdentityAuthority.analyze()` invokes that domain operation. It no longer publishes an unqualified empty array for mod/ref coverage.
- Regression coverage checks that the limitation remains explicit.

## Runtime trace

`CLI manifest scan interface → controller invocation manifest composition → invocation semantic pipeline → canonical SemanticKnowledgeDataFlow → semanticObjectIdentityAuthority.analyze → semanticObjectIdentityOperations.modRefEvidence → integrated response.objectIdentity`.

The knowledge graph is not duplicated. The existing upstream/domain path remains the owner; no generic relation foundation is recreated.

## Audit

Run `npm run audit:phase3039-object-identity-explicit-modref-coverage`. The audit checks the typed outcome, runtime operation use, existing CLI interface trace, deleted relation-foundation absence, and the one-newline-byte `collections.ts` sentinel.

The audit is static. Since `node_modules` is absent, this phase does not claim a successful full typecheck, Vitest run, or CLI-to-manifest end-to-end test.

## Remaining debt

- Mod/ref inference rules still need to be modeled before `mod_ref_evidence_derived` can be produced by the runtime.
- Primitive types and control-flow constructs remain where required at parser boundaries and in other domains. This phase does not claim global elimination.
