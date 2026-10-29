# Phase 2844 — Semantic Dataflow Interface Factory

## Runtime trace

`SemanticDataflowJudgment` → `semanticDataflowInterfaceFactory.fromJudgment(judgment)` → `SemanticDataflowInterface`.

## Contract change

The former exported `semanticDataflowInterfaceFromJudgment(judgment)` free function is now an interface-first frozen operation: `semanticDataflowInterfaceFactory: SemanticDataflowInterfaceFactoryInterface`. The operation reconnects the authoritative judgment without recomputing facts, origin identity, or proof metadata. The judgment and its typed reasoning contract are preserved; no primitive reasoning label is introduced.

## Scope and verification

The structural audit checks contract shape, public exports, preservation of the authoritative judgment, retirement of the old free-function export, and the empty `collections.ts` invariant. This is not a substitute for a full TypeScript build or end-to-end scanner execution.
