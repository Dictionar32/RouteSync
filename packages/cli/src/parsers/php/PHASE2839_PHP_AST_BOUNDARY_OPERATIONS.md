# Phase 2839 — PHP AST Boundary Operations

## Root cause

The parser boundary exposed `phpAstBoundaryFact` and `phpAstBoundaryJudgment` as independent exported arrow-function constructors. The judgment was data-only and included a `reasoning` label that described a workflow instead of expressing a domain operation. Consumers could bypass the judgment boundary and read `ast` directly.

## Runtime changes

- Replaced the two exported free constructors with `phpAstBoundaryOperations: PhpAstBoundaryOperationsInterface`.
- Added `continueWith` to `PhpAstBoundaryJudgment`, with explicit `onAdapted` and `onParserGap` handlers.
- Bound the continuation at the producer, where the `unsupported` AST arm is known.
- Removed the `reasoning` field from the judgment.
- Routed `boundaryAdapter.adapt` through the judgment operation and routed `nodeMapper` through `adapt`, keeping the operation on the actual runtime path.
- Kept the existing upstream contract vocabulary and kept `packages/core/src/types/upstream/collections.ts` empty.

## Trace

`PhpGrammarNode -> adaptGrammarNode -> phpAstBoundaryOperations.judgment -> PhpAstBoundaryJudgment.continueWith -> PhpAstBoundaryAdapterInterface.adapt -> PhpAstNodeMappingOperationInterface.map`

The parser-gap outcome is preserved as a typed continuation arm; it is not rewritten as an empty AST. This phase does not claim that every parser grammar dispatch in the repository has been eliminated: only this manifest-relevant parser-boundary path is in scope.

## Verification boundary

Run `npm run audit:phase2839-php-ast-boundary-operations`. The audit checks source structure and runtime trace references only; it is not a full typecheck or end-to-end test.
