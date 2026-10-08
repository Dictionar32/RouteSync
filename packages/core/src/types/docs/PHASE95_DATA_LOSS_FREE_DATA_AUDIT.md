# Phase 95 — Data Loss / Free Data / Nullish Audit

## Principle

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

This phase audits the Phase 94 implementation for semantic data loss, free primitive data, nullish fallback (`??`), implicit absence, and duplicated optionality.

## Laravel 13 grounding

The semantic model is grounded against the official Laravel 13 controller documentation:

- Resource controllers expose a documented action profile.
- `withTrashed()` has a distinct no-argument default action set and an explicit selected-action form.
- Resource middleware supports all/specific action scopes through `middleware`, `middlewareFor`, and `withoutMiddlewareFor`.
- Nested resource scoping is semantic binding behavior, not positional list behavior.

See: https://laravel.com/framework/docs/controllers

## Findings and implementation

### 1. Nullish fallback

The previous parser contained:

```ts
methods[0] ?? method
```

This was removed. The choice is now represented explicitly through `Presence` and a named target-method resolution datum before `targetAt()` is called.

There are now **zero `??` operators** in `packages/core/src`.

### 2. Semantic optionality

`RouteMiddlewareSemanticInput` previously exposed optional semantic fields:

- `action?`
- `classMiddleware?`
- `methodMiddleware?`
- `classExclusions?`
- `methodExclusions?`

These were changed to `Presence` ADTs. The semantic resolver therefore receives explicit absence instead of reconstructing absence from JavaScript `undefined`.

### 3. Controller middleware scope

The old representation:

```ts
{ middleware, only?: ActionName[], except?: ActionName[] }
```

encoded Laravel knowledge in optional primitive fields and forced the resolver to infer the scope.

The new representation is:

```ts
{ middleware, scope: RouteMiddlewareScope }
```

where the scope itself is the semantic ADT:

```text
all | only(actions) | except(actions)
```

No `only`/`except` inference remains in the semantic resolver.

### 4. Duplicate optionality adapters

The resource and constraint AST adapters previously wrapped `mapOptional` in local `mapPresence` / `toPresence` helpers. Those duplicate conversion concepts were removed. The shared `Presence` boundary is now used directly.

### 5. Silent undefined result

The binding AST adapter had an `absent` handler returning `undefined` even though its result was only used for side effects. It now returns the existing relation state. No semantic datum is fabricated or discarded through an `undefined` return.

### 6. Free data

Production semantic code contains no `any` fields in the audited route model/resolver layer.

The remaining `any` found by the audit was test-only and was replaced with the concrete `TokenDescriptor[]` type.

### 7. Intentional filtering vs data loss

The audit found `filter()` in resource action selection and route-source partitioning. These are retained because they represent explicit semantic operations:

- resource `only` / `except` selection;
- separating route-origin constraints from the aggregate constraint set.

They are not fallback-based data dropping. Unknown/unsupported semantic facts are not converted to empty collections.

## Audit results

```text
`??` / `??=` in core source                 0
production `any` in audited semantic layer  0
`filter(Boolean)`                            0
`findIndex`                                  0
`.at(...)`                                   0
numeric semantic index                       0
semantic ternary operators                   0
silent `undefined` side-effect return        0
```

The remaining `match[1]` in `routeBindingAstAdapter.ts` is a regex capture at the syntax extraction boundary. It is not a semantic collection index.

## Validation limitation

Changed semantic files type-check until the archive's pre-existing missing parser dependencies are reached. The archive still lacks baseline files such as `phpAstTypes` and `routeDeclarationParserHelpers`; therefore a full workspace compile is **not** claimed.

## Data-loss invariant

The semantic pipeline must preserve these distinctions:

```text
absent       != empty
absent       != default
unsupported  != dropped
expression   != stringified value
identity     != array position
```

Laravel knowledge belongs in ADTs, catalogs, relations, capabilities, and presence models. Flow code should only compose already-resolved knowledge.
