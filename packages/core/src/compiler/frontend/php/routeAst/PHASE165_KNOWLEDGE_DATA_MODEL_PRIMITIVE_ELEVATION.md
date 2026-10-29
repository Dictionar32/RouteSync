# Phase 165 — Knowledge Data Model Primitive Elevation

## Principle

A semantic model must not use primitive values as semantic references. Strings, numbers, and booleans are allowed only as leaf payloads of explicit value objects or source coordinates.

## Elevated concepts

- `KnowledgeId` is an object, not a branded string.
- `SemanticIdentifier` is an object, not a branded string.
- `SemanticOperation` is an object, not a branded string.
- source paths are `SemanticText`.
- source coordinates are `SemanticSourceSpan` / `SemanticSourceOffset`.
- literal payloads are typed value objects.
- blocks are represented by `SemanticRegion` facts.
- branch/loop bodies are real knowledge nodes and are connected through relations.

## Data-flow invariant

A relation must connect two distinct knowledge identities. Traversal order is never semantic. Empty regions have no invented source span.

## Boundary

Tree-sitter/PHP AST remains syntax evidence only. The canonical model contains facts, typed references, semantic regions, relations, and provenance. `Map`/`Set` are implementation indexes only.
