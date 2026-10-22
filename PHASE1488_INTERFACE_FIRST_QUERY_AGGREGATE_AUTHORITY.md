# Phase 1488 — Interface-first query aggregate authority

## Goal

Move semantic interpretation of Laravel relation-aggregate calls out of the scanner producer. The producer should gather ordered expression evidence and execute the resulting contract; the upstream algebra should own vocabulary lookup, relation-path parsing, alias interpretation, optional column semantics, and the distinction between unknown vocabulary and malformed evidence.

## Changes

- Extended `QueryProducerSemanticJudgment<T>` with `malformed`, carrying a diagnostic.
- Extended `QueryProducerSemanticInterface` with `resolveRelationAggregate(methodName, arguments, source)`.
- Implemented relation-aggregate interpretation in `queryProducerSemanticAlgebra.ts`.
- Replaced the producer's inline `relationAggregate` semantic logic with a call through the upstream interface and an explicitly named `toLegacyOption` compatibility projection.
- Added tests for valid aggregate evidence, malformed known vocabulary, unknown vocabulary, and compatibility projection.

## Architecture

`ExpressionAst evidence -> Expression[] evidence extraction -> QueryProducerSemanticInterface -> queryProducerSemanticAlgebra -> closed judgment -> compatibility projection -> QueryAst producer output`

The runtime producer still extracts positional arguments and constructs the final AST. It no longer parses relation aggregate paths or decides aggregate aliases/columns.

## Boundary and limitations

- The legacy producer output still projects `malformed` to `RelationOption.none`; this preserves current consumers but does not yet expose diagnostics downstream. A later migration should replace that compatibility projection with a diagnostic-carrying producer contract.
- This phase migrates one complete semantic family, not every `const` or function in scanner.
- Vitest, full typecheck, and package build must be run in the project's pinned dependency environment; static review alone is not evidence that they pass.
