# Phase 748 — Highest Semantic Frontier

## Diagnostic frontier

The user build reached ESM/CJS successfully and DTS stopped at three structural issues:

1. `SemanticRelationAtom` was consumed by the rewrite/identity layer but was not exported by the relational-algebra authority.
2. `semanticRewriteEngine.ts` used `Object.hasOwn`, which is outside the repository's ES2020 declaration target.
3. `semanticEvidenceRelationCompiler.ts` treated `SemanticPresence` as if `value` existed on the absent variant and referenced relation predicates without importing the semantic relation facade.

A targeted compiler run after the Phase 748 changes reports no diagnostics for the four changed semantic files. A full build is intentionally not claimed because this checkpoint has no installed workspace dependencies.

## Model elevation

The fixes are not compatibility casts:

- `SemanticRelationAtom` remains owned by `semanticRelationalAlgebra.ts` and is re-exported from the rewrite boundary.
- Presence projection now consumes the canonical `semanticPresenceFold` judgment, so an absent guard cannot leak a host optional field into the relation compiler.
- Relation equality/choice is sourced through `semanticRelations` rather than local host comparisons.
- The typed relation implementation now imports its relation-membership authority instead of relying on an undeclared collection vocabulary.
- The obsolete empty model-descriptor barrel export was removed; empty descriptor reservoirs remain non-authoritative.

## Next elevation frontier

The remaining architecture work is deliberately not a cast-removal campaign. The next scanner/lexer frontier is to lift:

`source evidence -> closed AST judgment -> canonical semantic relation -> constraint program -> indexed fixed point -> derivation witness -> rewrite -> target projection`.

In particular, scanner evidence, resolver graph, upstream AST mapping, analysis, semantic type lowering, and diagnostics should converge on the same closed semantic relation/constraint authority. Legacy parsed descriptors are evidence-only and must not be allowed to re-enter upstream contracts.
