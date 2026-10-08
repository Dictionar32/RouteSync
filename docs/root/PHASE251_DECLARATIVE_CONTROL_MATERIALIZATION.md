# Phase 251 — Declarative Control Materialization

## Purpose

Push the RouteSync control pipeline one stage beyond Phase 250: the generic relation solver must not stop at `normalized_choice` / `normalized_repetition` while a syntax-specific adapter still performs the semantic construction manually.

## Architecture

```text
parser / language evidence
        ↓
control evidence relations
        ↓
unified declarative relation program
        ↓
relation solver / rewrite engine
        ↓
normalized_choice / normalized_repetition
        ↓
semantic control materializer
        ↓
SemanticChoice / SemanticRepetition
        ↓
canonical control relations
```

The materializer accepts relation facts only. It does not accept PHP AST statement kinds and therefore has no semantic dependency on `if`, `switch`, `while`, `for`, or `foreach`.

## Identity invariant

Relation atoms remain scalar keys. A derived `Map<string, KnowledgeId>` resolves those keys back to the canonical typed identities already emitted as semantic facts. The map is an implementation index only; semantic truth remains in typed facts and relations.

## Result

The syntax adapter now has the narrower responsibility:

1. inspect source syntax as evidence,
2. emit syntax-neutral relation facts,
3. invoke the declarative solver,
4. delegate semantic construction to the materializer.

It no longer interprets a normalized control construct by itself.
