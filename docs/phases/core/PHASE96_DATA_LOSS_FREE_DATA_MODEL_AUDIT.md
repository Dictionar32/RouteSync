# Phase 96 — Data-Loss / Free-Data / Fallback / Index / Control-Flow Audit

## Prinsip

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

## Laravel grounding

Audit ini menggunakan Laravel 13.x Routing dan Controllers sebagai semantic source.
Laravel resource middleware memiliki scope `all`, `only`, dan `except`; resource `withTrashed()` tanpa argumen mempunyai default action profile `show/edit/update`, sedangkan argumen memilih subset. Route binding juga membedakan custom route keys, scoped bindings, `withoutScopedBindings`, dan `missing` behavior.

Sources:
- https://laravel.com/framework/docs/routing
- https://laravel.com/framework/docs/controllers

## Findings and implementation

### 1. Nullish / boolean fallback

Removed from semantic layer:

- `??`
- `||` fallback used as semantic default
- `filter(Boolean)`
- `findIndex`
- positional semantic lookup

`BINDING_SCOPING_CATALOG.get(key) || { kind: 'none' }` was replaced by an explicit knowledge lookup. A missing catalog entry is represented as a `Presence` and resolved to the explicit `RouteBindingScoping { kind: 'none' }` datum. The resolver no longer uses a fallback operator to manufacture meaning.

### 2. Collection cardinality

Route-group prefix, middleware, and name-prefix resolution previously used direct `if (values.length === 0)` branches. They now consume the existing `Cardinality` ADT:

```text
values
  ↓
Cardinality
  ├── empty
  └── non_empty
```

The semantic resolver dispatches on the ADT. Cardinality is knowledge, not Laravel-specific control flow.

### 3. Boolean presence

AST booleans such as `missingHandler`, `shallow`, `creatable`, and `destroyable` are converted once through `FlagPresence` / `fromBooleanFlag`. Semantic consumers receive presence data rather than repeatedly interpreting booleans.

### 4. Index arithmetic

No semantic-layer use of:

- `i + 1`
- `i + 2`
- `items[0]`
- `findIndex`
- `.at()`

The remaining index arithmetic in the lexer is syntax-token navigation. It is deliberately below the semantic boundary and does not encode Laravel meaning. Laravel semantics are represented by typed facts and ADTs after parsing.

### 5. Free data

No new untyped semantic `any`/object was introduced. Laravel decisions use existing identities, relations, capabilities, `Presence`, `Cardinality`, and typed catalogs.

Test-only legacy `as any` fixtures remain outside production semantic code and are not used as semantic data.

### 6. Data-loss invariant

The implementation must preserve:

```text
absent       != empty
absent       != default
unsupported  != dropped
expression   != string
identity     != position
unknown      != fabricated datum
```

## Remaining structural control flow

`if`/`switch` in the lexer and AST adapters are syntax-shape decoding. They are not Laravel semantic decisions. They may branch on token shape, AST union shape, or parser state.

A semantic `if/switch` must instead be represented by a catalog/ADT whenever the branch means something about Laravel behavior.

## Validation

Pattern audit over semantic/type-upstream source:

```text
??                         0
|| fallback                0
filter(Boolean)            0
findIndex                  0
.at(...)                   0
semantic i + N             0
semantic numeric index     0
```

Targeted TypeScript validation reaches baseline missing-source errors (`phpAstTypes`, `route.ts`, `collections.ts`). No new type error from the changed implementation was identified before the baseline dependency boundary.
