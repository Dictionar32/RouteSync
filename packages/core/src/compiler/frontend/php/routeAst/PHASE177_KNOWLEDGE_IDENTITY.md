# Phase 177 — Knowledge Identity Is Structured Occurrence Identity

`KnowledgeId` is no longer an opaque `SemanticText` path. It now carries a typed `SemanticKnowledgeIdentity` containing:

- semantic source location
- semantic role
- typed slot/occurrence discriminator

The generated string from `knowledgeIdKey()` is only a derived lookup key. It is not canonical knowledge.

Expression identity uses the semantic role `expression`, never a Tree-sitter/PHP AST node kind. The actual semantic kind remains the discriminated `SemanticFact` (`comparison`, `binary-operation`, `invocation`, etc.).

This separates:

- **identity** — which semantic occurrence is this?
- **provenance** — where did the knowledge come from?
- **fact kind** — what semantic knowledge is it?
- **lookup key** — how can an index find it efficiently?

`Map`/`Set` remains derived infrastructure only.
