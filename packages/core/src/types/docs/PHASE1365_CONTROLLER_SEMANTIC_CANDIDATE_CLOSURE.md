# Phase 1365 — Controller Semantic Candidate Closure

## Finding

`controllerDataflowAnalyzer.ts` projects canonical semantic knowledge bindings into `ControllerVariableDefinition`. That projection calls `semanticForValue`, but the function was absent from the module. The existing `solveSemanticCandidate` function already contained the intended source-evidence candidate algebra, including parameter-origin and `DB::table(...)` candidates, but was not connected to the producer call site.

The database-table candidate also used the empty-string predicate as its acceptance condition. That inverted the candidate guard: an empty table name could be accepted while a non-empty table name was rejected.

## Change

- Implemented `semanticForValue` as a narrow wiring function to `solveSemanticCandidate`.
- Kept the upstream `ControllerVariableSemantic` discriminated union as the result contract.
- Corrected the database-table candidate guard to require a non-empty table identity.
- Preserved the explicit `external` candidate as the conservative fallback.
- Did not add a parallel semantic representation or make downstream consumers reclassify the result.

## Contract flow

`SemanticKnowledgeDataFlow binding` → source-backed PHP AST payload → `semanticForValue` → `solveSemanticCandidate` → `ControllerVariableSemantic` → `ControllerVariableDefinition` → `ControllerSemanticVariableFlow` → existing controller consumers.

## Verification

The Phase 1365 static audit checks the producer-to-contract connection, candidate evidence and guard polarity, fallback semantics, and unchanged package/build metadata. This audit does not substitute for a TypeScript build or runtime tests. Full build remains unverified unless dependencies (including `tsdown`) are installed and the build completes.
