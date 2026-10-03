# Phase 90 — Identity Catalog & Relation Graph

Semantic Laravel knowledge is resolved by identity and explicit relations, not array positions.

```text
Route path → parent relation fact
Parameter → bindsTo → Model | Enum
Parameter → parentOf/childOf → Parameter
Class identity → semantic catalog entry
```

The binding resolver no longer uses `findIndex()` or `items[index]` to resolve action parameters, models, enums, or parent bindings.

Laravel 13 documents implicit model binding by matching route segments with typed parameters, and nested custom-key bindings create parent/child scoping. `scopeBindings()` and `withoutScopedBindings()` explicitly alter that semantic relation.

Catalog order is irrelevant: reordering models, enums, or action parameters does not change resolution.

## Test invariant

A catalog reorder test verifies identical binding semantics after reordering models and action parameters.

## Laravel evidence

Laravel 13 routing documentation states that implicit model binding resolves typed Eloquent models against matching route segments. For nested custom-key bindings, Laravel automatically scopes the child model to its parent; `scopeBindings()` can force that behavior and `withoutScopedBindings()` disables it.

Laravel 13 controller documentation separately defines resource actions and resource registration semantics.


The Phase 90 tests cover both relation extraction from `/users/{user}/posts/{post:slug}` and catalog reordering invariance.
