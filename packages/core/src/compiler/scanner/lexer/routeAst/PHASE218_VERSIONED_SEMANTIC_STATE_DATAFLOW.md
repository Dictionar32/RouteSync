# Phase 218 — Versioned Semantic State/Data-Flow

## Goal

Move RouteSync one level beyond syntax-driven and pairwise state analysis:
state definitions and merges receive semantic identities that can be queried by
use sites without making CFG/basic blocks/parser nodes the semantic authority.

## External design references

- LLVM MemorySSA models memory with `MemoryDef`, `MemoryUse`, and `MemoryPhi`,
  providing def-use/use-def chains and memory versions. RouteSync borrows the
  separation of definition, use, and merge, not LLVM's instruction/basic-block
  ontology.
- MLIR data-flow analysis uses explicit lattices and joins. RouteSync keeps
  canonical semantic facts separate from derived analysis state.
- CodeQL distinguishes AST structure from semantic data-flow nodes. RouteSync
  therefore treats parser/CST/AST/CFG information as evidence or analysis aids,
  not as the knowledge model.

## Canonical boundary

```text
Evidence
  -> SemanticFact / SemanticDataFlowFact
  -> versioned state analysis
  -> derived candidates
  -> consumers
```

The canonical facts remain in `SemanticKnowledgeDataFlow`. The new
`SemanticStateVersion` objects are derived analysis identities.

## Version kinds

- `definition`: a semantic state definition such as an assignment.
- `merge`: a semantic state merge whose incoming values may represent multiple
  possible state versions.

A version is not an execution timestamp and does not imply ordering.

## Precision rule

Phase 218 intentionally produces **may-candidates**. Without execution-order
or path-dominance evidence, it does not claim that a candidate is the nearest
reaching definition. Exact reaching-definition answers belong to a later
analysis layer.

## Map/Set rule

Maps and Sets are derived indexes/worklists only:

```text
canonical facts
  -> analysis
  -> Map/Set index
  -> derived answer
```

They are never the semantic source of truth.
