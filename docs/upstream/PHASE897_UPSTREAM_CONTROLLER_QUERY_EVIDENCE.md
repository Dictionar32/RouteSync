# Phase 897 — Upstream Controller Query Evidence

## Boundary

Controller method operations now consume canonical `QueryAst` evidence instead of inferring database behavior from controller action names.

The flow is:

`source expressions -> queryProducer -> QueryAst -> source-span containment -> controller query relation -> ControllerOperation`

## Derived operations

- known Eloquent model query evidence -> `model_query(Model)`
- known Eloquent model write evidence (`create`, `updateOrCreate`, `firstOrCreate`, or instance mutation/write operations) -> `model_write(Model)`
- literal `database_table` query evidence -> `database_table(Table)`

The projection is scoped by source file and method source span, and duplicate semantic operations are collapsed by kind + identity.

## Deliberate non-goals

- No inference from names such as `show`, `store`, or `update`.
- No controller-owned model-binding ontology; route upstream remains the authority for Laravel route/model binding.
- No Laravel-specific boolean fields are added to `ControllerMethodContract`.
- Query evidence remains canonical upstream evidence; controller projection is a semantic consumer of that relation.

## Laravel alignment

Laravel 13 documents controller actions such as `show` and resource actions, but the actual database behavior remains source behavior. Query evidence is therefore a stronger basis for `model_query` / `model_write` than action naming conventions. Laravel route model binding is independently defined by route/controller signatures and route configuration, so this phase intentionally leaves binding semantics in route upstream.

## Validation

Audit: `scripts/audits/audit-phase897-upstream-controller-query-evidence.cjs`

The audit verifies query consumption, source-span containment, query-derived write/table projection, producer/scanner/orchestrator plumbing, regression coverage, and absence of method-name inference.
