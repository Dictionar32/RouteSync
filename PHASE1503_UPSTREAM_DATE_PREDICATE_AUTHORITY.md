# Phase 1503 — Upstream Date Predicate Authority

## Model change

The query semantic authority now owns date-part predicates (`whereDate`, `whereMonth`, `whereDay`, `whereYear`, `whereTime` and `orWhere` variants) and relative-date predicates (`whereToday`, `wherePast`, `whereFuture`, and the supported variants). Each family has a closed rule identity in `QueryOperationSemanticDecision`.

The algebra owns method-to-part/junction mapping, field validation, operator validation, and construction of the closed `QueryOperationAst` judgment. An explicit date comparison operator must be a supported string literal; unknown operators produce `malformed` rather than silently becoming equality.

The scanner no longer has date-part or relative-date operation handlers in `queryNamedMethodOperationCatalog`. It submits method evidence to `resolveQueryOperation` and projects the resolved operation.

## Verification

Run `npm run audit:phase1503-upstream-date-predicate-authority`. The audit checks rule identity, upstream resolver ownership, removal of the migrated scanner handlers, tests, and documentation of the remaining boundary.

## Remaining boundary

This phase does not make the whole scanner a pure executor. Relation predicates, aggregates, row-value predicates, exists/raw/like/JSON predicates, ordering, grouping, and execution configuration still have legacy scanner-owned handlers. `QueryAst` also still exposes both `operationJudgments` and a compatibility `operations` projection. Those are the next ownership and single-source-of-truth migrations.

## Architectural target

`Source evidence → Typed semantic knowledge → Semantic reasoning algebra → Closed judgment → Interface contract → Wiring → Runtime executor → Downstream projection`
