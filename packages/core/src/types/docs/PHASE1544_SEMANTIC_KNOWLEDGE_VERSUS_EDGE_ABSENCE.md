# Phase 1544 — Semantic knowledge is not the same as data-flow-edge evidence

## Trace

This phase traces the existing upstream semantic knowledge model and its scanner compatibility consumer:

- `types/upstream/semanticDataflowKnowledge.ts` defines `SemanticKnowledgeDataFlow` as three separate collections: semantic `facts`, `dataFlow` edges, and derived `relations`.
- `compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts` previously chose its execution anchor only from `model.dataFlow[0]?.source`.
- Consequently, an input with semantic facts but no data-flow edges was treated as if it had no evidence at all and bypassed canonical semantic execution.
- The upstream input producer can represent an empty edge set when an existing source anchor is available; it does not require an invented edge.

## Model improvement

The analyzer now obtains its source anchor from the first data-flow source, or—if the edge set is empty—from the identity of an existing semantic knowledge fact. It then passes the model through `createSemanticDataflowInput` and the upstream runtime executor as usual.

The compatibility judgment distinguishes:

- `dataflow_facts_present`: there is at least one data-flow edge;
- `semantic_knowledge_present_without_dataflow_edges`: semantic knowledge exists, but the edge set is empty;
- `semantic_data_flow_no_evidence`: neither a data-flow edge nor a semantic knowledge fact provides an anchor, so no semantic judgment is fabricated.

This is a semantic-model correction, not just a conditional fix: absence of a relation is no longer conflated with absence of source knowledge.

## Interface-first principle

No new solver, authority, or parallel interface is introduced. Existing input adapter, runtime executor, reasoning authority, and admission boundary remain the single execution route. The scanner only chooses an already-present source anchor and projects the accepted judgment into its deprecated compatibility format.

## Verification

`npm run audit:phase1544-semantic-knowledge-versus-edge-absence` checks the migration contract and regression-test presence. Run the focused Vitest test and package build in an environment with the repository's pinned dependencies installed; static audit alone is not a substitute for type-checking or runtime tests.

## References

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic consumers use stable semantic contracts rather than duplicating operation-specific knowledge.
- MLIR Language Reference: https://mlir.llvm.org/docs/LangRef/ — IR models operations and values separately from textual syntax.
- TypeScript Compiler Architectural Overview: https://github.com/microsoft/TypeScript/wiki/Architectural-Overview/a7e867225f7f6e969b9972d9836bbacff5eecef2 — parsing, binding, semantic checking, and emission have separate responsibilities.
