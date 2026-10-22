# Phase 1648 — Remove New Derivation-Layer Dependency on semantic/foundation

## Correction

Phase 1647 accidentally introduced direct imports from `packages/core/src/semantic/foundation` into the new declarative derivation contract and generic rule compiler. That contradicted the intended migration direction.

## Changes

- `SemanticJudgmentDerivationInterface` no longer imports `SemanticRelationAtom`; its literal domain is a caller-owned generic defaulting to `unknown`.
- `SemanticJudgmentRuleCompiler` now lowers declarations into a neutral `CompiledSemanticJudgmentRule` protocol and has no dependency on `semantic/foundation`.
- The invocation algebra selects `string` as its current literal domain at the concrete runtime adapter boundary, where the legacy rewrite engine is still used.
- Phase 1646/1647 audits were updated for the neutral contract, and Phase 1648 adds a boundary regression audit.

## Scope and remaining migration

This phase removes the accidental dependency from the newly introduced derivation interface/compiler. It does **not** claim that all of `semantic/foundation` has been emptied or that all existing upstream consumers have been migrated. Existing legacy imports elsewhere remain migration work. The directory/files should only be emptied after their remaining consumers have been moved, while preserving the requested structure.
