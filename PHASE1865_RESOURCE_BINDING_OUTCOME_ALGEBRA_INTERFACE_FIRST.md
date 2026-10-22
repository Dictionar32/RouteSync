# Phase 1865 — Resource Binding Outcome Algebra, Interface First

## Trace

Phase 1864 had an upstream semantic model describing the three outcome cases, but those cases were represented as descriptive string literals. The authority still made candidate-cardinality decisions directly inside `judgeResourceModelBinding`, while the authority interface did not expose which exact semantic model and rewrite rules it implemented.

## Interface-first changes

1. Introduced `ResourceModelBindingCandidateCardinality`, a closed ADT with `no_candidate`, `one_candidate`, and `multiple_candidates` variants. Each variant constrains its candidate collection shape.
2. Introduced `ResourceModelBindingOutcomeFormationModelInterface` and its canonical model. The contract explicitly states the mapping from cardinality to `unresolved`, `resolved`, or `ambiguous`, including the evidence and provenance that must be retained.
3. Advanced `ResourceModelBindingSemanticJudgmentModelInterface` to version 4 and made its `outcomeFormation` field reference the typed outcome model instead of a collection of free-standing string descriptions.
4. Advanced `ResourceModelBindingJudgmentAuthority` to version 3. The authority contract now exposes the exact upstream semantic model and rewrite rule set it realizes.
5. Refactored outcome materialization to first close candidate cardinality into the ADT and then eliminate that ADT through the shared relational variant fold. The authority no longer branches directly on `candidates.length === 0` or `candidates.length === 1` to construct outcomes.
6. Exported the new semantic types/model and advanced the Laravel resource scanner contract to version 15. The integrated response still preserves the exact controller scan and invocation judgments, and AST projection still occurs only after the subject-correlated batch closure.

## Boundary

This phase strengthens the semantic contract and removes ad-hoc candidate-count classification from the judgment constructor. It does **not** claim that all fixed-point/cycle mechanics have been eliminated from `resourceModelBindingAuthority.ts`; the batch closure executor remains the next interface-first frontier. No code was moved into `semantic/foundation`, and no full package build/typecheck was run.

## Audit

`packages/core/scripts/audits/audit-phase1865-resource-binding-outcome-algebra-interface-first.cjs`
