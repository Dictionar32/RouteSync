# Phase 2255 — Action Semantic Judgment Contract Closure

## Root-model correction

The prior action contract conflated two different concepts in one value-level `coverage` ADT:

1. The shape of the canonical action semantic judgment.
2. The unfinished migration of legacy projection/derivation implementations.

The canonical `LaravelControllerActionSemanticKnowledge` already enumerates the required semantic fields: controller and source identity, action name, response-reference judgment, dependencies, request judgment, dataflow, schema, body judgment and facts, resource bindings, and semantic/runtime return products. Marking each published judgment as `action_semantic_knowledge_partial` made implementation migration debt look like a semantic outcome.

## Interface change

- Removed the `coverage` discriminant from `LaravelControllerActionSemanticJudgmentInterface` values.
- Removed the compiler projection from the semantic judgment value itself. `LaravelControllerActionSemanticJudgmentPublication` now carries `{ judgment, projection }` as sibling products.
- Changed route/action correlation to compare only canonical semantic identity and source provenance; it no longer relies on projection identity.
- Changed action execution input to accept the projection-free judgment only.
- Kept the canonical semantic knowledge fields required and source-correlated.
- Moved outstanding projection/derivation obligations to `LaravelControllerActionSemanticJudgmentContract.projectionMigration`.
- Kept those obligations typed, including body source-AST projection, request-binding compatibility, legacy action derivation, and transitive relation algebra.
- Updated the existing action authority composition and public type exports to the evolved contract version 45.
- Updated action execution contract wording so migration status is not presented as a semantic outcome.

## Important boundary

This phase closes a **modeling error in the upstream interface**; it does not claim the legacy derivation implementation has already migrated. Production still calls `resolveControllerActionContract`, and `semantic/relations` still has transitive users. Those are implementation obligations, not alternative semantic states attached to each action judgment.

The next implementation step must move those derivations into the existing upstream authorities and source-evidence boundaries, then remove the corresponding entries from `projectionMigration` only after actual call-path and output-parity checks prove each obligation discharged.

## Verification

The Phase 2255 structural audit checks the canonical required fields, the separation of migration obligations from judgment values, the production contract wiring, and the public export boundary. It does not substitute for TypeScript compilation or runtime tests.
