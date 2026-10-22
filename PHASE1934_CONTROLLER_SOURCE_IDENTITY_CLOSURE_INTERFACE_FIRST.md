# Phase 1934 — Controller Source Identity Closure (Interface First)

## Trace finding

Phase 1933 packaged the controller source, invocation judgment, semantic knowledge projection, and statement payloads as one `sourceCorrelation` value. The package shape alone did not guarantee that `sourceCorrelation.sourceFile`, `invocationJudgment.sourceFile`, and `semanticKnowledgeProjection.sourceFile` represented the same source file: TypeScript interfaces are structurally typed and `readonly` does not enforce identity equality.

## Interface-first change

The existing `laravelSourceIdentitySemantics.relateSourceFiles` contract is now reused by the existing `ControllerDataflowSemanticJudgmentAuthority`. Before reading canonical knowledge, judging bindings, composing variable flow, or publishing integrated response, the authority validates the canonical source subject against both the invocation judgment and knowledge projection. The relation is narrowed through the existing typed `same_source_file_identity` judgment. A malformed correlation raises a contract-violation error before semantic closure; it is not reclassified as a valid semantic judgment. No separate identity authority or semantic-foundation layer was introduced.

The scanner remains an evidence collector and forwards the same correlation bundle. It does not perform source identity comparison.

## Versioned contracts

- `ControllerDataflowSemanticJudgmentAuthorityInterface`: version 8.
- `ControllerDataflowInvocationSemanticModelContract`: version 6.
- `LaravelControllerInvocationSemanticBoundaryContract`: version 96.

## Validation

Run `npm run audit:phase1934-controller-source-identity-closure-interface-first` for the targeted static audit. Related phase audits are also kept aligned with the current contract versions. TypeScript build and the full test suite were not run in this phase.
