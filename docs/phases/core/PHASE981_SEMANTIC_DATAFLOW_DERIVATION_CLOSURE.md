# Phase 981 — Semantic Dataflow Derivation Closure

- Removed `AstRuleName` / `AstWitnessName` from `SemanticDataflowDerivation`.
- Added closed `SemanticDataflowRuleName` and `SemanticDataflowWitnessName` vocabulary.
- The canonical dataflow authority now constructs semantic derivation identities directly.
- `astMappingInterface.ts` remains AST-specific and is not mixed into the semantic dataflow contract.
- No second solver was introduced; least-fixed-point closure remains the single dataflow authority.
