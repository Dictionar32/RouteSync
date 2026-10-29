# Phase 3044 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Intent

Phase 3043 still classified `SemanticFact.kind` inside the mod/ref consumer. This phase moves that responsibility to the explicit PHP semantic evidence construction sites and makes the canonical upstream model carry the result as `SemanticModRefFact` values.

## Domain change

- `SemanticKnowledgeDataFlow` now carries `modRefFacts` alongside canonical facts and flow relations.
- `SemanticModRefFact` is a closed union of source-backed assignment, invocation, access, and unset effect blockers.
- `semanticModRefFactFactory` exposes interface-backed constructors for each domain variant.
- PHP expression and statement evidence producers explicitly emit the matching effect fact at the same site where the canonical semantic fact is created.
- `semanticObjectIdentityOperations.modRefEvidence` consumes `model.modRefFacts`; it no longer classifies the broad `SemanticFact` union.
- `semanticModRefFactOperations` has no `switch`, visitor, lookup table, or map-based classifier.

## Runtime trace

`PHP AST syntax evidence producer → SemanticKnowledgeDataFlow { facts, modRefFacts, dataFlow, relations } → invocation semantic pipeline → semanticObjectIdentityAuthority.analyze(knowledge) → semanticObjectIdentityOperations.modRefEvidence(model) → semanticModRefFactOperations.blockers(model.modRefFacts) → integrated response/CLI manifest composition`.

The CLI contract remains interface-backed at `packages/cli/src/manifestScanOperationInterface.ts`; composition remains owned by `ControllerInvocationManifestCompositionAuthorityInterface`.

## Provenance and loss audit

Every emitted mod/ref effect fact keeps the originating `KnowledgeId` and `SemanticSource`. Effects are appended at the exact producer site rather than reconstructed later by index or inferred from a consumer-side kind check. The existing `SemanticFact` and data-flow evidence are retained; the new property is an additional canonical domain projection.

## Explicit limits

This is not a repository-wide claim that every `string`, `number`, `boolean`, `undefined`, `null`, `reduce`, empty array, `??`, ternary, `if`, equality operator, type predicate/assertion, lookup, `switch`, `map`, or exported function has been removed. Parser and syntax-evidence boundaries still require primitive representations. The phase specifically removes mod/ref fact classification from the consumer path without disguising it as a generic visitor or lookup table.

Mod/ref rules and callable effect summaries remain unmodeled; blockers stay visible and source-backed. Full repository typecheck, complete Vitest, and end-to-end CLI → manifest execution are not claimed. Several legacy imports refer to relation foundation files that are absent by explicit workspace constraint; this phase does not restore them.

## Verification

Run `npm run audit:phase3044-source-emitted-modref-domain-facts`. The audit checks the closed effect ADT, source construction sites, canonical model wiring, CLI/composition interfaces, deleted relation foundation absence, and the one-newline `collections.ts` sentinel.
