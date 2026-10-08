# Phase 102 — Syntax Navigation as a Data Model

## Objective

Strengthen Phase 101 so syntax traversal is represented by a model rather than a positional counter.

The rule is not "remove every `if`/`while` from a lexer". The rule is:

> syntax knowledge belongs in the syntax model; Laravel semantic knowledge belongs in the semantic model.

## Navigation representation

`TokenCursor` no longer stores `position`.

It stores:

```text
remaining tokens
history tokens
terminal token
```

Navigation is therefore expressed through named relations:

```text
current
previous
next
after_next
call_open
call_argument
second_call_argument
terminal
```

The parser does not perform positional arithmetic.

## Control-flow rule

The syntax navigation model itself contains no `if`, `while`, `for`, `switch`, `continue`, or `break` statements. Traversal uses sequence operations and state values represented as data.

This does not impose the same restriction on the parser grammar.

Parser control flow remains valid when it expresses:

- token recognition;
- delimiter detection;
- nesting/depth;
- AST construction;
- syntax-fact extraction.

Removing such control flow mechanically would make the syntax model less expressive rather than more semantic.

## Laravel boundary

Current Laravel 13 routing semantics include route-group merging, implicit/explicit model binding, enum binding, custom binding keys, scoped bindings, constraints, and missing-model behavior. These are semantic knowledge and must remain upstream of the syntax navigation layer. citeturn0search0

Laravel 13 controller/resource semantics include middleware scopes, resource capabilities, singleton capabilities, and controller attributes. These also belong in semantic ADTs/catalogs rather than token traversal. citeturn0search2

Laravel 13 also provides structured route metadata that recursively merges through route groups. This is another semantic relation that should be modeled as data rather than encoded as traversal branching. citeturn0search3

## Data-loss invariants

```text
absent      -> Presence/explicit syntax absence
unknown     -> preserved as unknown
unsupported -> preserved as unsupported fact
identity    -> identity, never ordinal position
```

Audit target:

```text
??                  0
semantic || fallback 0
filter(Boolean)     0
findIndex           0
.at()               0
raw token arithmetic outside cursor 0
```

## Evolution rule

A new syntax pattern should add a named syntax relation/pattern when it is structurally reusable.

A new Laravel feature should add an Entity, Relation, Capability, Constraint, Presence, Provenance, ADT, or Catalog.

Neither change should require downstream flow to learn a new Laravel-specific branch.
