# Phase1929 — Canonical Knowledge and Invocation Judgment Interface First

## Trace findings

Phase1928 already moves binding correspondence, identity closure, variable-flow composition, and integrated-response composition into `ControllerDataflowSemanticJudgmentAuthority`. The remaining contract weakness was that `ControllerDataflowInvocationSemanticModelInterface` exposed `semanticKnowledgeProjection.knowledge` and a second `semanticKnowledgeDataFlow` field for the same knowledge value, while the integrated-response composition result also retains that knowledge value. The duplicate output field was not read by production code in the repository trace and could theoretically disagree at the public model boundary.

## Interface changes

- `ControllerDataflowInvocationSemanticModelInterface` now publishes one canonical knowledge field: `semanticKnowledgeProjection.knowledge`.
- Removed the duplicate `semanticKnowledgeDataFlow` model property and the now-unnecessary knowledge generic parameter.
- Preserved `invocationJudgment` and `invocationSemanticIntegratedResponse` as separate values; neither is reconstructed from the other.
- Preserved per-binding correspondence, identity, unresolved outcomes, and resolved-only definitions.
- Advanced the model contract to version 3, the controller dataflow authority contract to version 3, and the Laravel controller semantic boundary contract to version 91.
- Added `scripts/audits/audit-phase1929-canonical-knowledge-invocation-judgment-interface.cjs`.

## Verification

The Phase1929 static audit passed 11/11 checks. The audit checks contract-version consistency, single canonical knowledge ownership, retained invocation/integrated-response separation, authority wiring, upstream exports, and absence of new type assertions in the migrated semantic files.

No build, TypeScript compilation, or full test suite was run. This phase is a targeted interface-model correction, not a claim that the entire compiler pipeline is compile-verified.
