# Phase 1542 — Explicit no-evidence outcome in the runtime contract

## Scope and source trace

This phase continues the existing Phase 1541 interface-first dataflow route. It does not create another reasoning engine or a second semantic model.

- `types/upstream/semanticDataflow.ts` owns the canonical input, closed judgment, source identity, derivations, paths, and closure certificate.
- `types/upstream/semanticDataflowAuthority.ts` derives a judgment for a sourced input.
- `types/upstream/semanticDataflowInterface.ts` owns judgment admission and now also defines the explicit no-evidence runtime outcome.
- `types/upstream/semanticDataflowRuntimeExecutor.ts` composes the authority and admission boundary and constructs the typed no-evidence outcome.
- `compiler/scanner/wiring/semanticDataflowInputAdapter.ts` translates scanner knowledge evidence into canonical input when evidence exists.
- `compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts` routes both non-empty execution and empty-evidence reporting through the same upstream runtime contract. The legacy return shape remains a compatibility projection.
- `compiler/scanner/subscanners/queryEvidenceProducer.ts` is a separate semantic family: it uses `queryProducerSemanticAlgebra` and evidence-bound validation, but retains an explicit compatibility catalog for unclaimed query-operation families.

## Model improvement

Before this phase, the analyzer's empty-dataflow branch directly manufactured a legacy judgment wrapper. That path did not pass through the runtime interface and risked presenting “no evidence” as if it were a derived closed judgment.

At Phase 1542, the runtime interface distinguished `execute(input)` from `noEvidence('no_dataflow_facts')`. Phase 1543 supersedes that two-operation shape with a single `execute(request)` method over a discriminated request algebra, so consumers cannot choose a separate runtime entry point for absence.

The scanner's compatibility result carries this status explicitly so downstream consumers can distinguish an empty evidence surface from a completed analysis.

`SemanticDataflowNoEvidenceResult` is a closed protocol outcome, not a `SemanticDataflowJudgment`. No source identity, derivation, or closure certificate is fabricated for the empty case. The deprecated scanner facade still returns its historical wrapper for compatibility, but its result now carries `evidenceStatus: 'no_dataflow_facts' | 'dataflow_facts_present'`, preserving the distinction instead of disguising absence as a derived judgment.

## Why interface-first

The runtime contract owns the distinction between “a judgment was derived and admitted” and “there was no evidence to derive a judgment from.” Phase 1543 further makes the scanner's no-evidence compatibility variant distinct from the derived-judgment variant, so absence is not mislabeled as a completed fixed-point judgment. The executor itself performs no classification or fixed-point reasoning; it only composes existing upstream authority/boundary and constructs the explicit protocol outcome.

## Scanner migration frontier

This phase does not claim all 540 scanner files are migrated. A targeted import scan found direct references to the dataflow runtime authority/boundary only in the dataflow analyzer and its upstream implementation. Query production is governed by a different existing upstream algebra; its compatibility catalog is still a documented frontier and should be migrated by extending its existing contract, not by adding a parallel interface.

Recommended next order:

1. Migrate consumers from the deprecated `SemanticDataFlowJudgment`/`toLegacyPath` projection to canonical `SemanticDataflowJudgment` or a typed projection contract.
2. Audit all semantic producer families in `compiler/scanner` against their existing `types/upstream` authority interfaces, cataloguing duplicate semantic decisions separately from syntax extraction and source-span/evidence collection.
3. Close the query producer's unclaimed operation families by extending `queryProducerSemanticAlgebra` and its evidence-bound contract; do not move the catalog wholesale into the scanner or create a second solver.
4. Only then simplify runtime executors and remove compatibility code after reference and regression audits prove it is unused.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic analyses should query semantic behavior through interfaces rather than special-case concrete operations.
- MLIR Language Reference: https://mlir.llvm.org/docs/LangRef/ — IR nodes and values model semantic content independently of textual representation.
- TypeScript compiler architectural overview: https://github.com/microsoft/TypeScript/wiki/Architectural-Overview/a7e867225f7f6e969b9972d9836bbacff5eecef2 — parsing, binding, checking, and emission are distinct stages.

These references support the separation principle; they do not prove RouteSync's implementation is correct. RouteSync correctness is checked by the repository audit and build/test results.

## Verification

The Phase 1542 audit command is retained as a compatibility entry point and validates the evolved contract. For the current model, run `npm run audit:phase1543-runtime-execution-request-algebra`. Both are targeted static audits, not substitutes for TypeScript build or runtime tests.
