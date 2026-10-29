# Phase 152 — Knowledge/Data Model Above Tree-sitter

## Trace conclusion

Tree-sitter is the syntax substrate. Its node types and queries describe concrete syntax and matching structure; they are not the semantic ceiling.

The audit target is therefore not removal of `if`, `while`, or `switch`. The target is removal of **domain knowledge encoded by those control-flow constructs**.

## Changes

- Resource semantic action/scope selection is now represented by immutable knowledge tables and keyed lookup.
- Route-group binding scope is a knowledge table.
- Route binding key/trashed behavior is a knowledge table.
- Existing `KnowledgeFlow` remains the semantic layer above syntax: fact, state, transition, alternative, choice, iteration.
- Runtime loops remain interpreter mechanics only.

## Next trace targets

The remaining semantic switches in upstream route resolvers are candidates for the same treatment:

- constraint method -> matcher knowledge
- middleware scope -> applicability relation
- resource AST adapter method -> resource mode knowledge
- semantic fact kind -> resolver knowledge

The desired architecture is:

Tree-sitter CST -> syntax facts -> semantic knowledge model -> data flow -> consumers
