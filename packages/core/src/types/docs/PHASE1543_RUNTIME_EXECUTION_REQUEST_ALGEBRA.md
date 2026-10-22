# Phase 1543 — Runtime execution request algebra

## Trace

This phase continues the Phase 1542 interface-first dataflow route across:

- `types/upstream/semanticDataflow.ts` — canonical semantic facts and proof-carrying judgment;
- `types/upstream/semanticDataflowInterface.ts` — runtime request/result contract and admission boundary;
- `types/upstream/semanticDataflowRuntimeExecutor.ts` — the sole composition of authority, admission, and protocol dispatch;
- `compiler/scanner/wiring/semanticDataflowInputAdapter.ts` — scanner evidence to canonical input;
- `compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts` — consumer wiring and compatibility projection.

## Model-level change

Phase 1542 made absence of evidence explicit at the executor boundary, but its separate `noEvidence()` method meant consumers still chose between two runtime operations. This phase replaces that split with one `execute(request)` method over a discriminated request algebra:

- `evidence_input` carries canonical `SemanticDataflowInput`;
- `no_evidence` carries the explicit `no_dataflow_facts` protocol reason.

The executor performs protocol dispatch. It does not classify source semantics or derive facts on the no-evidence branch. Evidence-bearing requests still go through the existing reasoning authority and judgment admission boundary.

The scanner compatibility model is also a discriminated union. Empty evidence now returns `semantic_data_flow_no_evidence` with `semanticStatus: 'not_evaluated'`; it no longer claims `least_fixed_point`, relation closure saturation, or a derived closed judgment without having run reasoning. The legacy `analyzeSemanticDataFlow()` projection still returns an empty analysis for API compatibility.

## Why this is more than a local fix

The contract now makes an invalid state harder to express: a no-evidence result cannot be confused with an admitted semantic judgment by checking its `kind`. The executor is the single runtime entry point for both request variants. This follows the interface principle in MLIR: generic consumers should use stable behavioral contracts rather than duplicate operation-specific semantic knowledge.

## Residual migration frontier

- `toLegacyPath()` and the legacy analysis API remain compatibility projection and should be removed only after downstream consumer migration.
- `queryEvidenceProducer.ts` remains a separate semantic family with its own upstream algebra and compatibility catalog; it must be migrated through that existing contract, not by sharing this dataflow executor blindly.
- The rest of `compiler/scanner` has not been exhaustively migrated by this phase.

## Verification

Run `npm run audit:phase1543-runtime-execution-request-algebra` and the focused Vitest test for `semanticDataFlowAnalyzer.phase908.test.ts`. Static audit success does not replace package build or full regression tests.

## Design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- MLIR Language Reference: https://mlir.llvm.org/docs/LangRef/
- TypeScript Compiler Architectural Overview: https://github.com/microsoft/TypeScript/wiki/Architectural-Overview/a7e867225f7f6e969b9972d9836bbacff5eecef2
