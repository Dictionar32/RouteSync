# Phase2463 — Model Cast Upstream Authority

`ModelCastSourceEvidence` is an upstream-owned, compiler-AST-independent input contract. Its closed `ModelCastTargetSourceEvidence` ADT preserves whether the target came from a string literal or PHP class reference. `modelCastEvidenceProducer` extracts syntax evidence from PHP AST, then `modelCastFactsAuthority` owns Laravel cast-target judgment and returns canonical `ModelCast` values.

The active path is:

`PHP model AST → ModelCastSourceEvidence[] → ModelCastFactsAuthorityInterface → ModelCast[]`

The authority uses `export const modelCastFactsAuthority: ModelCastFactsAuthorityInterface` and has no direct `semantic/relations`, `semantic/foundation`, or `EloquentCastMapper` dependency. The scanner-local cast derivation that mixed compiler AST types with semantic judgment has been retired.

This phase closes cast semantic ownership only. Accessor source evidence, remaining model helper relation imports, the `modelVocabulary.ts` relation import, and transitive PHP-expression authority dependencies remain open. Full project typecheck, package build, Vitest, and end-to-end CLI validation have not passed/been run in this workspace.
