# Phase 1530 — Closed Judgment Carries Its Semantic Conclusion

## Objective
Strengthen the upstream semantic judgment interface before runtime-authority wiring. This phase changes a type contract, an audit, package audit registration, and phase documentation only. No runtime or scanner function body is changed.

## Trace finding
`QueryOperationSemanticProvenanceJudgmentFor<Rule>` represented a resolved result with only `{ kind: 'query_operation_ast'; family: Rule }`. That identifies the shape and family of the conclusion but does not carry the actual `QueryOperationAst` required by a downstream projection. The contract therefore said the judgment was resolved without containing the semantic result it claimed to establish.

## Model change
The resolved provenance judgment now carries `operation: QueryOperationAst` inside its conclusion, while retaining the family tag. The result is still indexed by `Rule`, and the resolved state still requires a fully satisfied family-specific obligation ledger. `malformed` continues to carry an evaluated ledger and diagnostic; `undetermined` continues to preserve the unresolved ledger. These outcomes remain distinct.

## Scope boundaries
- Changed `packages/core/src/types/upstream/queryProducerSemanticInterface.ts` only for the judgment model.
- Added `scripts/audits/audit-phase1530-closed-judgment-conclusion.cjs` and its package script.
- Did not change `queryProducerSemanticReasoning.ts` implementation or `queryEvidenceProducer.ts` function bodies.
- Runtime authority is still a target interface, not claimed to be wired end-to-end.
- Legacy scanner fallback remains until coverage proves the upstream authority owns each migrated operation.

## Verification
The Phase 1530 audit checks that resolved judgments carry the actual AST, preserve proof obligations, keep outcome states distinct, retain family-correlated execution plans, and leave reasoning/scanner implementations untouched. Full build/typecheck must be reported separately; earlier workspace build was blocked because `tsdown` was missing.
