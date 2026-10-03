# Phase 92 — Audit: Knowledge Model vs Control Flow

## Result

Phase 91 was **not yet structurally clean**. The audit found three concrete issues:

1. `compiler/scanner/descriptors` still existed as the semantic boundary. It was renamed to `compiler/scanner/semantic`; the semantic layer is no longer named as a descriptor wrapper.
2. Binding semantic resolution used `switch` over `Presence` ADTs. It now uses presence-keyed semantic maps.
3. Constraint semantic resolution used `switch` over Laravel constraint methods. It now uses a method-keyed semantic resolver catalog.
4. Controller/domain presence resolution in the group semantic resolver used `if`; these are now presence-keyed maps.

## Laravel grounding

Laravel 13 documents:
- implicit model binding from route parameter / controller parameter identity;
- custom-key nested binding and scoped binding;
- `scopeBindings()` and `withoutScopedBindings()`;
- `missing()` as route-level missing-model behavior;
- resource `withTrashed()` and its action-specific defaults;
- nested resource `scoped()` and `shallow()`.

These are semantic facts and relations, not downstream flow decisions.

## Remaining audit boundary

Syntax adapters and lexers may still use ordinary parsing control flow and token indexes because they are syntax reconstruction, not semantic interpretation. The semantic boundary must not use indexes to assign domain meaning.

## Invariant

```text
Laravel syntax
  -> AST
  -> typed fact
  -> identity / relation / capability / ADT
  -> semantic interface
  -> dumb flow
```

No Laravel-specific meaning is introduced by downstream composition.
