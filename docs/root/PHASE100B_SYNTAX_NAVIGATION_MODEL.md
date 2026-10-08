# Phase 100B — Syntax Navigation as a Model

## Goal

Do not mechanically remove `if`, `while`, or `continue` from a lexer. That would confuse two different concerns:

- syntax-machine mechanics;
- Laravel semantic knowledge.

Instead, syntax navigation itself is modeled as a first-class abstraction.

## Model

```text
TokenStream
    ↓
SyntaxNavigation
    ├── relation
    │   ├── current
    │   ├── previous
    │   ├── next
    │   ├── after_next
    │   ├── call_open
    │   ├── call_argument
    │   ├── second_call_argument
    │   └── terminal
    ├── advance
    ├── find
    └── spanUntil
    ↓
Typed Syntax Fact
    ↓
Semantic Knowledge Model
```

The parser therefore talks about syntax relations instead of positional arithmetic.

## Why loops still exist internally

A navigation abstraction is an implementation of a finite-state/sequence machine. Some loop or recursion must exist somewhere. Moving the loop from every parser into the navigation implementation is an improvement because:

```text
BAD
parser A → i + 1
parser B → i + 2
parser C → i++
parser D → index - 1

GOOD
parser A ─┐
parser B ─┼→ SyntaxNavigation
parser C ─┤
parser D ─┘
```

The arithmetic and traversal state are implementation details of the navigation model, not knowledge repeated throughout parsers.

## Data-loss invariant

Never convert:

```text
absent → empty
unknown → default
unsupported → dropped
expression → string
identity → position
```

Syntax optionality may remain at the AST boundary. Semantic absence is represented by `Presence`.

## Laravel boundary

Laravel semantics remain upstream in entities, relations, capabilities, constraints, provenance and ADTs. Current Laravel routing documents describe route groups, model binding, constraints, and resource behavior as semantic concepts; none requires token positions to be part of the semantic model.

## Upgrade rule

A new syntax form should extend `SyntaxNavigation` with a named relation/pattern only when that relation is structurally reusable. A new Laravel behavior should extend the semantic model, not the navigation machine.
