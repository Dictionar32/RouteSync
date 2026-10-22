# Phase 1533 — Evidence-bound interface admission

## Trace

`types/upstream/semanticDataflow.ts` owns the closed semantic-dataflow ADT and judgment construction. `types/upstream/semanticDataflowAuthority.ts` owns the fixed-point/path reasoning implementation. `types/upstream/semanticDataflowInterface.ts` names the stable boundary. The scanner's `lexer/routeAst/semanticDataFlowAnalyzer.ts` is a deprecated compatibility facade: it invokes the upstream authority and converts canonical paths to legacy `KnowledgeId` values.

## Change

Added `SemanticDataflowJudgmentBoundaryInterface` and `semanticDataflowJudgmentBoundary`. The boundary only admits/rejects the already-produced judgment based on closure markers, presence of evidence collections, and origin/node identity conservation. It never derives facts, recomputes closure, or repairs a partial judgment. The scanner compatibility facade now passes the upstream judgment through this admission gate before projecting to the legacy vocabulary.

## Architecture intent

`source evidence -> upstream semantic reasoning -> closed judgment -> admission interface -> compatibility wiring -> downstream projection`

The authority remains the only solver. The boundary is not a second solver and is not a substitute for proof validation. Its current checks are structural admission checks; derivation soundness and path completeness remain the responsibility of upstream algebra invariants and tests.

## Remaining frontier

- Migrate remaining consumers of `SemanticDataflowJudgment` to the boundary contract where they cross into runtime/downstream execution.
- Add adversarial tests for origin mismatch, missing collections, and rejected closure markers using test-only forged values.
- Review the fixed iteration limits in `reachClosure` and `pathClosure`; do not claim mathematical fixed-point completeness until truncation behavior is made explicit or proven unreachable under domain constraints.
- Preserve the scanner facade only for compatibility; do not add semantic classification or fallback reasoning there.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic consumers query a typed interface rather than special-casing concrete implementations.
- MLIR Language Reference: https://mlir.llvm.org/docs/LangRef/ — IR semantics and invariants are represented explicitly and can be verified.
- TypeScript compiler architecture: https://github.com/microsoft/TypeScript/wiki/Architectural-Overview/a7e867225f7f6e969b9972d9836bbacff5eecef2 — parsing, semantic checking, and emission have distinct responsibilities.
