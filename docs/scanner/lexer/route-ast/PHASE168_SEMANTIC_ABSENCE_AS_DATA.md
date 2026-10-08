# Phase 168 — Semantic Absence as Data

## Principle

RouteSync's canonical Knowledge/Data-Flow Model must not encode domain knowledge through
optional properties or `undefined`.

The distinction is:

- parser/navigation internals may use `undefined` as an implementation mechanism;
- canonical semantic knowledge must encode meaningful absence as typed data.

This keeps the source of truth declarative and explainable.

## Changes

### 1. Typed semantic presence

Added `SemanticPresence<T>`:

```ts
Present<T> { value: T }
Absent { reason: SemanticAbsenceReasonDefinition }
```

Absence reasons currently include:

- `not_applicable`
- `not_provided`
- `empty_clause`
- `void_transition`

### 2. Removed semantic optional properties

The canonical semantic model no longer uses `?` for domain fields such as:

- value `name` / literal `value`
- invocation `receiver`
- outcome `value`
- transition `value`
- iteration `condition`
- iteration `initializer`
- iteration `update`
- iteration `iterable`
- iteration `target`
- region source provenance

### 3. Vocabulary elevation

Meaning-bearing literals that were still represented directly as string unions were promoted
to definitions/catalogs:

- `SemanticValueKindDefinition`
- `SemanticOperatorCategoryDefinition`
- `SemanticOutcomeRoleDefinition`
- `SemanticAccessModeDefinition`

The existing operator/relation/iteration/transition catalogs remain source data; `Map` remains
a derived lookup index only.

### 4. Producer behavior

Examples:

```ts
for (;;) { ... }
```

is represented as:

```text
condition  -> absent(empty_clause)
initializer -> absent(empty_clause)
update      -> absent(empty_clause)
```

while `iterable` and `target` are explicitly `not_applicable`.

And:

```ts
return;
```

is represented as:

```text
transition.value -> absent(void_transition)
```

rather than an omitted property.

## Boundary rule

This does **not** mean every `undefined` in RouteSync must disappear. Syntax navigation,
search helpers, parser lookups, and temporary implementation state may legitimately use
`undefined`. The audit target is semantic knowledge that would otherwise lose information
through absence.

## Validation

Targeted TypeScript validation of:

- `semanticKnowledgeDataFlowRelations.ts`
- `semanticKnowledgeDataFlowProducer.ts`

shows no new errors in either file. The repository still has pre-existing unrelated upstream
type errors, including missing exports from `types/upstream/valueObjects`.

The local workspace does not currently contain installed `vitest`, so the new regression tests
could not be executed in this environment.
