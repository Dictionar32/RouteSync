# Phase 3052 — Semantic Knowledge Validation Domain Operations

## What changed

`packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowRelations.ts` no longer imports the deleted `relationMembership` foundation or delegates validation to `semanticTypedRelation`. The scanner semantic-validation boundary now directly verifies the canonical model's invariants:

- semantic fact identity is unique;
- each data-flow endpoint exists in the fact inventory;
- a data-flow fact cannot self-reference;
- each present guard points to an existing predicate fact;
- every derived relation edge is backed by a canonical data-flow fact with matching endpoints, relation kind, and role.

The public surface remains an explicit named interface and typed exported object:

```ts
export interface SemanticKnowledgeDataFlowWiringInterface {
  readonly validate: (dataFlow: SemanticKnowledgeDataFlow) => void;
}

export const semanticKnowledgeDataFlowWiring: SemanticKnowledgeDataFlowWiringInterface = Object.freeze({ validate });
```

## Why this is domain-owned

These checks are semantic knowledge invariants, not generic collection behavior. They now live at the PHP scanner's semantic validation boundary and operate on canonical `SemanticFact`, `SemanticDataFlowFact`, and derived `SemanticDataFlowEdge` data. No deleted relation module or kernel re-export was restored.

## Runtime trace status

The path remains:

`CLI manifest scan → controller invocation manifest composition → PHP semantic producer → PHP AST semantic adapter → semantic validation → manifest preparation`.

The validator's direct imports were migrated, but the full path is **not build-clean yet**. The adapter still imports deleted relation operations and the compiler sequence facade still imports `semantic/relations/relationalSequence`. The adapter also has a compatibility import from `semanticRelationalCollections`, whose target is deleted. These are the next migration frontiers.

## Verification

- Phase 3052 audit: checks validator ownership, preservation of five invariants, absence of forbidden foundation files, and the protected `collections.ts` byte invariant.
- Phase 3051 frontier audit rerun: now finds four direct imports in the traced path (down from five in its original report).
- Strict TypeScript attempt remains blocked by many transitive imports into deleted relation modules from upstream closure/rewrite/constraint code; CLI-to-manifest E2E was not run.

## Honest scope

This phase does not claim to eliminate all `if`, equality checks, strings, numbers, or arrays. The validator still contains local runtime control flow for rejecting invalid input. The next design improvement is to model validation findings as a closed domain outcome and expose a named continuation operation, while preserving the current failure messages and evidence. No generic relation foundation should be recreated to do that.
