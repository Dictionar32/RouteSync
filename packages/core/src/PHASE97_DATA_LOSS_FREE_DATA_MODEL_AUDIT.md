# Phase 97 — Data-Loss / Free-Data / Control-Flow Audit

## Principle

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

Laravel knowledge must be represented upstream as typed facts, Presence, Identity,
Relation, Capability, Constraint, Provenance, or ADT. Semantic flow consumes the
knowledge rather than rediscovering it through `if`, `switch`, fallback operators,
or positional indexes.

## Laravel 13 grounding

The audit is grounded against the current Laravel 13 routing/controller documentation.
Laravel resource controllers define action sets; `apiResource` has a reduced action
profile; `withTrashed` has documented default actions and can select a subset; nested
binding can be scoped; `scopeBindings` and `withoutScopedBindings` explicitly control
binding scope; `missing` represents custom missing-model behavior; and resource
middleware supports all-action and per-action inclusion/exclusion.

Sources:
- https://laravel.com/framework/docs/routing
- https://laravel.com/framework/docs/controllers

## Findings elevated in Phase 97

### 1. Binding scoping fallback

Removed:

```ts
catalog.get(key) || { kind: 'none' }
```

The catalog already has a semantic lookup boundary. The resolver now delegates to
`resolveBindingScopingKnowledge`, which preserves catalog absence as a modeled
`none` state instead of using JavaScript fallback semantics.

### 2. Route-group cardinality

Prefix, middleware, and name-prefix handling no longer use semantic `if` branches.
Cardinality is modeled as:

```text
empty
non_empty
```

and resolved through catalogs. Empty remains an explicit cardinality rather than a
missing/default fallback.

### 3. Resource AST method/scope mapping

Resource registration method and middleware scope mappings moved from `switch/case`
to typed catalogs. Laravel method knowledge therefore becomes data at the AST-to-fact
boundary.

### 4. Missing-handler mapping

The boolean AST flag is mapped through a typed catalog into the `RouteMissingFact` ADT.
No semantic `if` is required.

### 5. Middleware normalization

Middleware declaration normalization no longer branches with semantic `if` statements.
The declaration shape is mapped through an explicit identity catalog. Middleware
parameter cardinality is represented through the shared cardinality model.

Controller middleware Presence is preserved through the append operation: an absent
controller declaration is not converted into an empty semantic collection before
processing.

### 6. Binding path extraction

Route parameter extraction uses a named regex capture and Presence instead of a numeric
capture index. The semantic route layer therefore has no `match[1]`-style positional
knowledge.

## Static audit

Semantic route production code:

```text
??                         0
||                         0
ternary                    0
if / else / switch / case  0
filter(Boolean)            0
findIndex                  0
.at(...)                   0
++ / --                     0
i + N / j + N / k + N      0
numeric semantic index     0
=== undefined              0
!== undefined              0
=== null                   0
!== null                   0
```

Tests may still use array positions for assertions. Those are test observations,
not semantic construction logic.

## Lexer boundary

The Laravel AST lexer still contains token traversal such as `tokens[i + 1]` and
loop counters. This is intentionally retained as syntax traversal. It is not a
semantic Laravel decision and moving it into the semantic model would invert the
architecture.

The boundary is therefore:

```text
Token position / syntax navigation
        ↓
Typed syntax fact
        ↓
Semantic knowledge model
        ↓
AST-free semantic flow
```

## Data-loss invariant

```text
absent       != empty
absent       != default
unsupported  != dropped
expression   != stringified value
identity     != array position
catalog miss != JavaScript fallback
```

## Validation

The archive does not contain the complete workspace configuration/dependency set.
A TypeScript source compilation was still executed against the available source.
Remaining errors are baseline missing files:

- `types/upstream/route.ts`
- `types/upstream/collections.ts`
- lexer `phpAstTypes`
- lexer `routeDeclarationParserHelpers`

No Phase 97 semantic-layer type error remains in the available source beyond those
missing baseline modules.
