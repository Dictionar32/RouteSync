# Phase 1500 — Interface-first query operation rule authority

## Scope

Trace and strengthen the semantic contract between `core/src/types/upstream` and `core/src/compiler/scanner` without claiming that the whole scanner has already become a pure executor.

## Trace findings

1. `types/upstream/queryProducerSemanticInterface.ts` already owns judgments for model origin, model static operations, query joins, and basic `where` conditions. Before this phase, scanner wiring manually called `resolveQueryJoinOperation` and then `resolveQueryBasicOperation`, which meant rule-family selection was still orchestration logic in `queryEvidenceProducer.ts`.
2. `compiler/scanner/subscanners/queryEvidenceProducer.ts` still contains `queryNamedMethodOperationCatalog` and many query-operation constructors/resolvers. It remains a semantic authority for families such as relation predicates, `whereBetween` families, ordering/grouping operations, and other named query methods. These are not yet migrated by this phase.
3. `query.ts` retains both `operationJudgments` and `operations`. The former preserves malformed outcomes; the latter is a compatibility projection. Consumers must migrate to judgments before the projection can be removed safely.
4. The generic `QueryProducerSemanticJudgment<T>` still has no rule identity. A consumer of that generic result cannot tell which semantic rule produced the result without reconstructing context.

## Model improvement implemented

- Added `QueryOperationEvidence`, a typed evidence object containing a domain `MethodName` and ordered expression arguments.
- Added closed `QueryOperationSemanticRule` identities. These are ADT variants, not raw string identifiers.
- Added `QueryOperationSemanticDecision`, which couples the result with the rule identity.
- Added `resolveQueryOperation` to `QueryProducerSemanticInterface` and its algebra implementation. The interface now decides between the upstream-owned basic-condition and join rule families and preserves `malformed` rather than flattening it into an absent option at this boundary.
- Updated `queryEvidenceProducer.ts` to call this single interface method instead of sequencing the two semantic resolvers itself.
- Added a test covering resolved, malformed, and unclaimed outcomes.

## Known migration frontier — not yet closed

The `unclaimed_query_operation_rule` result intentionally exposes that other method families still live in the scanner catalog. It is not permission to classify an unknown method as valid. The scanner still falls through to the legacy catalog for those families. The end-state requires moving each family’s rule model and semantic construction into upstream algebra, then shrinking scanner code to evidence extraction, interface invocation, and AST/sequence assembly.

## Recommended next sequence

1. Promote the remaining catalog entries to typed upstream rule-family ADTs and evidence contracts; avoid `string` method dispatch as semantic identity.
2. Move rule definitions and result construction for relation predicates/aggregates, `whereBetween`, date predicates, ordering/grouping, and remaining query families into upstream semantic algebra.
3. Replace scanner-side `queryNamedMethodOperationCatalog` with a single call to `resolveQueryOperation`; malformed must remain a diagnostic judgment and must never be silently converted to `none`.
4. Migrate AST consumers from compatibility `operations` to authoritative `operationJudgments`; remove duplicate projection only after consumer coverage is proven.
5. Add an audit that fails if query semantic catalogs or operation-variant construction remain under `compiler/scanner`.
6. Verify unit tests, full typecheck, package build, and downstream IR/route projection before claiming executor-only runtime.

## Verification status

Source-level changes and focused static checks are possible in this workspace. Full project build/test is not claimed until the repository's pinned TypeScript and test/build dependencies are available and executed.
