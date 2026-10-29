# Phase 2984 — Explicit Semantic Closure Runtime Operations

## Scope

This phase continues from Phase 2983 and migrates one coherent upstream domain slice: semantic closure. It does not claim the entire upstream/CLI/manifest/IR path has been migrated.

## Model changes

- `packages/core/src/types/upstream/semanticClosureEngine.ts` no longer imports `relationResolve` or `relationEqual` from the deleted relation foundation.
- Canonical relation-name recognition is owned by this domain module.
- `CanonicalSemanticRelationNameJudgment` is a closed judgment with `continueWith(...)`; consumers continue from the domain result rather than receiving a bare boolean.
- Public runtime entry points are exposed through `semanticClosureRuntimeOperations: SemanticClosureRuntimeOperationsInterface = Object.freeze({...})`.
- The manifest compilation artifact and relevant tests now invoke `semanticClosureRuntimeOperations.closeRelations(...)` and `.createFact(...)`.
- Legacy exported standalone entry points `closeCanonicalSemanticRelations`, `closeCanonicalSemanticTheory`, and `canonicalSemanticFact` are no longer exported.

## Runtime trace

```text
Laravel route/controller/resource/model source
  ↓
PHP source reader + scanner / route AST
  ↓
Upstream semantic theory facts
  ↓
semanticClosureRuntimeOperations.createFact(...)
  ↓
semanticClosureRuntimeOperations.closeRelations(...)
  ├─ judgeRelationName(...)
  │    └─ CanonicalSemanticRelationNameJudgment.continueWith(...)
  ├─ validateSemanticTheoryFact(...)
  └─ solveSemanticBehavior(...)
  ↓
SemanticClosureResult (facts + evidence + saturation judgment)
  ↓
semanticCompilationArtifact.closure
  ↓
manifest / IR lowering consumers
```

This trace describes the targeted semantic-closure route, not proof that every scanner, CLI, manifest, and IR consumer is migrated.

## Audit findings and next steps

1. `semanticClosureEngine.ts` no longer depends on the deleted `relationalSequence` or `semanticRelations` foundation.
2. The public runtime API now has one explicit typed operation object.
3. The relation-name judgment has a domain continuation operation. Its implementation still uses a local `if` to construct the ADT; this is an implementation branch, not evidence that all primitive reasoning has been eliminated.
4. `semanticDecisionAlgebra.ts`, `semanticMapping.ts`, and other upstream modules still contain legacy relation-foundation imports. Migrate them one domain at a time; do not create a generic replacement foundation or repopulate `collections.ts`.
5. Next priority: continue from the build-log import paths and migrate the upstream-to-CLI-to-manifest-to-IR consumers, verifying every callsite before removing compatibility exports.

## Verification limits

The phase audit checks structural contracts and runtime callsite migration. TypeScript syntax transpilation is not a full typecheck. The historical `build.log` contains broader unresolved-import failures; the full workspace build and complete test suite remain unverified.
