# Phase 256 — Single Declarative Control Execution Boundary

Phase 256 closes the remaining semantic-control execution leak: the PHP AST adapter no longer imports or invokes the control relation solver/materializer directly.

## Architecture

```text
parser / language evidence
        ↓
control evidence facts
        ↓
semanticControlExecution
        ↓
unified declarative control program
        ↓
generic relation solver
        ↓
normalized / canonical / version relations
        ↓
syntax-neutral materialization
        ↓
semantic control knowledge
```

The adapter remains a syntax evidence decoder. It may recognize source-language statement kinds at the parser boundary, but semantic control execution is owned by one facade backed by one declarative relation program.

## New boundary

`semanticControlExecution.ts` exposes:

- `executeSemanticControlChoice()`
- `executeSemanticControlRepetition()`

Both functions execute the same `solveSemanticControlProgram()` and then consume its relation IR through the existing syntax-neutral materializer.

## Invariants

- `semanticControlEvidence.ts` remains inert ontology/schema only.
- `semanticControlProgram.ts` is the only declarative semantic rewrite authority.
- `phpAstSemanticKnowledgeDataFlowAdapter.ts` does not directly import the solver or materializer.
- Semantic-control modules contain no `if_statement`, `switch_statement`, `while_statement`, `for_statement`, or `foreach_statement` source-kind names.
- `Map` remains an implementation lookup in materialization/indexing; relation facts remain the semantic source of truth.

## Validation

- Phase 255 single semantic control authority: PASS
- Phase 253 unified declarative control version program: PASS
- Phase 254 unified control relation execution: PASS
- Phase 251 materialization: PASS
- Phase 252 construction relations: PASS
- Phase 248 canonical control dependence: PASS
- Focused TypeScript compilation: PASS
- Semantic-control syntax audit: PASS
