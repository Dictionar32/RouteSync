# Phase 1511 — Keyed Query Rule Dispatch

## Problem addressed

Phase 1510 removed the family `if` chain from the old algebra file but still tried each query-operation evaluator in sequence. That was still generic dispatcher-driven rule discovery.

## Change

- Kept `QueryProducerSemanticInterface` as the existing contract.
- Made each semantic rule binding declare its exact method vocabulary.
- Built `queryOperationMethodRuleCatalog` from those declarations.
- `resolveQueryOperation` now performs one exact method-name lookup and invokes at most the selected evaluator. Unknown method names return `unclaimed_query_operation_rule` without probing other resolvers.
- Kept each selected evaluator responsible for validating its own arguments and producing a closed semantic judgment; dispatch no longer infers the applicable rule by repeated `not_applicable` results.
- Preserved `queryProducerSemanticAlgebra` as the compatibility facade.

## Boundary

This removes *generic sequential rule probing* from operation dispatch. It does not claim that every evaluator has become a fully declarative inference rule: argument validation and AST/judgment construction remain inside the selected semantic rule evaluator. That is the next distinct migration if the goal is to remove procedural reasoning from rule bodies too.

## Verification

- Phase 1510 boundary audit: run `npm run audit:phase1510-query-semantic-reasoning-boundary`.
- Phase 1511 keyed dispatch audit: run `npm run audit:phase1511-keyed-query-rule-dispatch`.
- Full build/typecheck/Vitest status must be checked separately; this audit does not claim those pass.
