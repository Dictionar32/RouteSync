# Phase 176 — Knowledge Identity Belongs to Canonical Facts

## Principle

The canonical `facts` collection is the source of truth. A `Set` or `Map` may validate or index that knowledge, but must not decide which knowledge exists.

## Change

`produceSemanticKnowledgeDataFlow` no longer deduplicates facts through a `Set<string>`. Every produced fact is retained in the canonical facts collection.

A semantic invariant validator now checks:

- every fact has a unique `KnowledgeId`;
- every data-flow edge points to existing facts;
- no edge self-references;
- temporary `Set` usage is validation-only and is not semantic state.

## Identity vs provenance

`KnowledgeId` remains an opaque typed identity. `SemanticSource` independently carries source provenance. The identifier is therefore not used as a replacement for provenance.

The producer may derive deterministic identity values from syntax evidence, but the canonical model does not use source traversal order or a lookup table as semantic truth.

## Result

```text
syntax evidence
      |
      v
semantic producer
      |
      v
canonical facts  <---- source of truth
      |
      +---- depends_on / flows_to ----+
      |                               |
      v                               v
 data-flow edges                 derived indexes
                                  Map / Set
```

The important distinction is that indexes answer queries over the model; they do not define the model.
