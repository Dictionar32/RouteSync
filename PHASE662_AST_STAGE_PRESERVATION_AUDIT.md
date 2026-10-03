# Phase 662 — AST Stage Preservation Frontier Audit

## Model

RouteSync is now modeled as a closed AST semantic transformation pipeline:

`source syntax -> scanner evidence -> upstream mapping -> resolver graph -> analysis -> semantic type lowering -> target projection`

Every stage has a closed contract, declarative relation vocabulary, least-fixed-point reasoning mode, semantic rewrite authority, and explicit preservation relations.

## Changes

- Added `astSemanticStagePreservation.ts`.
- Added closed `AstSemanticPreservationRelation` vocabulary.
- Added closed `AstSemanticPreservationFact` algebra for all six stage transitions.
- Added preservation contracts derived from each stage contract.
- Scanner operator spellings were isolated into `phpAstExpressionSyntaxEvidenceRegistry.ts`; `astClassifierEvidence.ts` no longer owns `??`, `===`, `!==`, or `??=` spellings as semantic implementation literals.
- `ResourceModelResolver` optional inputs were replaced by explicit `Presence` contracts.
- Removed generic resource mapping constructor casts from the resource upstream adapter; typed constructor relations now return closed upstream ADTs directly.
- Corrected inactive-file vacuum audit so a file cannot appear referenced solely by its own basename in its own source text.
- Emptied confirmed inactive files: `ScannedHttpErrorResponseDescriptor.ts`, `rawTypeConverter.ts`, `frozenSet.ts`, and the now-unreferenced `errorFactories.ts`.
- Legacy `semanticRelationSolver.ts` and `syntaxErrorRelationCore.ts` remain zero-byte.

## Verification

Phase 662 audit: PASS.

Inactive-file vacuum: PASS; `candidates=[]`, `remainingNonEmptyCandidates=[]`, `allCandidatesEmpty=true`.

Targeted TypeScript transpilation: PASS for all ten modified non-empty TypeScript boundaries.

Full `tsc --noEmit`: blocked by missing workspace type definitions `node` and `vitest/globals`; this is an environment/dependency limitation, not a transpile failure in the modified files.

## Remaining frontier

The largest remaining semantic leak is in `packages/core/src/compiler/scanner/subscanners/request-deriver/queryEvidenceProducer.ts` and adjacent request/resource adapters. Remaining `if`, collection-method calls, raw `null`, and primitive `any` usage there must be converted into source-evidence ADTs and declarative relations rather than mechanically deleted.

The next architectural step is a closed stage judgment/proof interface that attaches derivation witnesses to every stage port, followed by source-to-target semantic preservation/refinement checks.

## Research trace

- MLIR interfaces and dialect conversion: generic transformation through interfaces, conversion targets, rewrite patterns, and type conversion.
- WebAssembly Component Model/WIT: typed directional interfaces and worlds as explicit composition contracts.
- CodeQL: semantic data-flow graph separate from source AST.
- K: rewrite-rule based executable semantics.
- egglog/e-graphs: Datalog-style deduction combined with rewriting/equality saturation.
- Alive2: refinement/translation validation and SMT-backed transformation checking.
- CIRCT: multi-level MLIR-based IR and explicit lowering/verification flows.
- Flix: ADTs and Datalog-oriented semantic modeling.
- Attribute grammar research: declared dependency evaluation and circular fixed points.
- Datafrog/Differential Dataflow/Souffle-family systems: relational closure and incremental fixed-point computation.
- Spoofax/Statix: declarative constraints and scope graphs for resolution.
- CompCert: semantic preservation as the correctness boundary between compiler representations.
