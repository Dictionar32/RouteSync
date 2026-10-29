# Phase 1537 — Semantic Dataflow Proof-Boundary Contract

## Goal

Strengthen the existing upstream semantic-dataflow interface before changing solver or scanner implementations. The interface is an admission/verification boundary, not a second reasoning engine.

## Trace

- `packages/core/src/types/upstream/semanticDataflow.ts`: canonical closed dataflow judgment, facts, derivations, lineage, and paths.
- `packages/core/src/types/upstream/semanticReasoning.ts`: proof facets for evidence, derivation, provenance, and closure.
- `packages/core/src/types/upstream/semanticDataflowAuthority.ts`: sole owner of closure, path derivation, and judgment production.
- `packages/core/src/types/upstream/semanticDataflowInterface.ts`: admission contract consumed at the scanner compatibility boundary.
- `packages/core/src/compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts`: obtains the upstream judgment, admits it, and only then projects to the legacy scanner vocabulary.

## Interface model change

`SemanticDataflowJudgmentBoundaryInterface.admit` now checks more than the presence of `closed: true` markers. It verifies:

1. reasoning strategy and the evidence/derivation/provenance/closure facets agree;
2. the judgment source span matches its semantic node;
3. origin identity matches the judgment node;
4. all input facts remain present in the closure;
5. derivation premises and conclusions reference facts in that closure;
6. path endpoints, step continuity, and path-step membership are consistent;
7. fact lineage remains closed and its declared source matches its producer identity.

The boundary only validates already-produced evidence. It does not calculate closure, infer facts, rebuild paths, or repair the judgment. `semanticDataflowAuthority.ts` remains the single solver authority.

## Scanner boundary

The scanner compatibility facade continues to call the upstream reasoning authority and then `semanticDataflowJudgmentBoundary.admit` before converting the canonical result to the historical scanner shape. Rejected judgments fail closed.

## Verification limits

The Phase 1537 static audit checks the contract invariants and authority wiring. A full TypeScript build and runtime test suite were not run in this workspace because `node_modules`, `tsc`, and `tsdown` are unavailable. Static audit success must not be represented as a successful build.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- TypeScript Compiler Architectural Overview: https://github.com/microsoft/TypeScript/wiki/Architectural-Overview/a7e867225f7f6e969b9972d9836bbacff5eecef2
