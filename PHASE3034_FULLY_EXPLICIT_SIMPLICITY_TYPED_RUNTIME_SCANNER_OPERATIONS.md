# Phase 3034 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope

This phase continues the actual upstream → CLI → manifest runtime trace by promoting `KnowledgeId` equality from a serialized key comparison to an upstream domain operation. The migration is deliberately scoped to `invocationSemanticJudgmentAuthority.ts`; it does not claim that every consumer of `knowledgeIdKey`, every primitive, or every control-flow construct has been removed.

## Domain model

`packages/core/src/types/upstream/semanticDataflowKnowledge.ts` now exports:

- `KnowledgeIdEquality`, a closed equality judgment (`same_knowledge_id` / `different_knowledge_id`).
- `SemanticKnowledgeIdOperationsInterface`, the explicit operation contract.
- `semanticKnowledgeIdOperations.same`, an interface-backed operation that compares source provenance through `semanticSource.same`, then semantic role and slot.

The equality contract includes source path, span offsets, evidence provider, role, and slot. The derived `knowledgeIdKey` remains available for other legacy index consumers but is no longer used by the invocation semantic authority.

## Runtime consumer migration

`packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts` now uses typed identity judgments for invocation, receiver, ordered arguments, target, binding claims, effect flows, trace subjects, and witness ownership. Composite obligation identity is compared through `sameObligationIdentity`, preserving obligation kind, invocation identity, argument identity, and ordered ambiguous candidates without building a composite string key.

The existing CLI manifest scan operation and controller invocation manifest composition remain the runtime entry and composition boundaries. The authority still validates evidence; it does not repair or silently reinterpret missing facts.

## Verification

Run:

```sh
npm run audit:phase3034-knowledge-id-domain-operations
npm run audit:phase3033-invocation-semantic-source-identity-domain-operations
npm run audit:phase3032-invocation-name-source-provenance-identity
npm run audit:phase3031-invocation-evidence-identity-adt
```

The Phase 3034 audit is a static contract audit. The focused Vitest test has been added but is not claimed as executed without project dependencies. Full typecheck and CLI → manifest end-to-end behavior remain unverified.

## Invariants

- Do not restore `relationMembership`, `relationalSequence`, or `semanticRelations`.
- Keep `packages/core/src/types/upstream/collections.ts` as exactly one newline byte.
- Preserve provenance, argument order, proof trace, unresolved obligations, and rejection behavior.
- Do not claim global elimination of `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, arrays, `??`, ternaries, `if`, `switch`, or `map`. Those require domain-by-domain migrations; parser and runtime boundary representations remain necessary in some places.
