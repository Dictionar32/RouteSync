# Phase 1931 — Invocation Composition Provenance Closure (Interface First)

## Trace

`controllerDataflowAnalyzer` obtains a `SemanticKnowledgeEvidenceProjection` from the upstream evidence adapter and passes it to `ControllerDataflowSemanticJudgmentAuthorityInterface`. The authority previously unpacked `.knowledge` before calling `InvocationSemanticIntegratedResponseCompositionInterface`, so the composition boundary lost the projection's source identity and evidence-provider provenance even though the controller model retained them.

## Interface-first correction

- `InvocationSemanticIntegratedResponseCompositionInput` now accepts the complete `SemanticKnowledgeEvidenceProjection` rather than a detached `SemanticKnowledgeDataFlow`.
- The composition executor reads the canonical graph once and supplies that exact graph to both inventory and invocation analysis.
- The response-only result remains unchanged: it does not republish knowledge or evidence provenance.
- The controller judgment authority passes the projection as-is and preserves the exact PHP invocation pipeline result.
- Composition contract version advances to 20; invocation pipeline contract version advances to 59; controller judgment authority advances to 5; Laravel scanner boundary advances to 93.

## Boundaries

No new semantic authority was introduced. The existing inventory, invocation pipeline, publication authority, controller dataflow judgment authority, and source evidence adapter retain their ownership. The scanner remains an evidence collector and delegate rather than a semantic reasoning owner.

## Validation

Run `node scripts/audits/audit-phase1931-invocation-composition-provenance-closure-interface-first.cjs` for the focused static contract audit. This phase does not claim a TypeScript build, package build, or end-to-end test was run.
