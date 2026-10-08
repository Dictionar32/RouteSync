# Phase 102 — Declarative Syntax Grammar Model

## Principle

`if`/`while`/`continue` are not data-loss by themselves. They are grammar-machine implementation when they express token recognition, delimiters, nesting, repetition, or AST construction.

The stronger architecture is not to delete them mechanically. It is to move repeated grammar knowledge into a declarative syntax model:

```text
TokenStream
  ↓
SyntaxNavigation
  ↓
SyntaxGrammar
  ├── token
  ├── sequence
  ├── repeat
  ├── until
  └── delimited
  ↓
Typed Syntax Fact
  ↓
Laravel Semantic Knowledge Model
```

The parser describes grammar patterns; the syntax engine owns traversal state. This is analogous to parser/lexer libraries that expose token `next`/peek and composable repetition/delimiters, while the scanning engine retains its internal state machine. Tree-sitter likewise separates grammar/token definitions from external scanner mechanics, and Logos exposes a lexer iterator rather than requiring callers to manage token positions. 

## Boundary

Allowed inside syntax engine:

- loop/state needed to consume tokens;
- delimiter recognition;
- nesting/depth bookkeeping;
- token recognition;
- AST construction;
- syntax-fact extraction.

Not allowed here:

- Laravel resource semantics;
- binding inference;
- middleware applicability;
- resource capability inference;
- semantic defaults/fallbacks;
- dropping unsupported expressions.

Those belong to the semantic Knowledge Model (`Entity`, `Relation`, `Capability`, `Constraint`, `Presence`, `Provenance`, `ADT`, `Catalog`).

## Data-loss invariant

```text
absent   → Presence.absent
unknown  → preserved as unknown/expression
unsupported → preserved, not silently dropped
identity → domain identity, never ordinal position
```

## Audit target

Raw positional arithmetic remains private to `TokenCursor`/syntax engine. Parser code should consume named syntax relations and declarative patterns rather than `tokens[i + N]` or hand-written traversal state.

## Current implementation status

The new model is additive. Existing `TokenCursor` remains the sole owner of positional arithmetic, and existing parser behavior is not mechanically rewritten merely to make source code look branchless.

The declarative grammar layer is the migration seam for future parser work. A parser construct should move there when its repeated structure is grammar knowledge (`sequence`, `repeat`, `until`, `delimited`), while Laravel-specific interpretation continues to move upward into the semantic model.
