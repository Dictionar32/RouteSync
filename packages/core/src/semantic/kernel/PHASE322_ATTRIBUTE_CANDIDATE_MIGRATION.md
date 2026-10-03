# Phase 322 — Attribute candidate witness bridge

This phase adds an explicit candidate form whose payload is already a `RelationOption<T>`.

## Purpose

The parser/query migration must not convert `if (guard) return value` mechanically. Such a rewrite can destroy continuation semantics. Optional semantic candidates therefore carry their own witness relation:

`candidate -> requirements -> RelationOption<T> -> solver witness`

`solveOptionalCandidate` selects a satisfying candidate and returns its witness directly.

## Architectural direction

Concrete syntax may still contain PHP `if/for/while/switch`; those are syntax evidence. Semantic implementation is migrated toward:

`syntax relation -> candidate relation -> requirement relation -> optional witness -> attribute/fixed-point closure -> rewrite`

No host-language sentinel is introduced by this bridge.
