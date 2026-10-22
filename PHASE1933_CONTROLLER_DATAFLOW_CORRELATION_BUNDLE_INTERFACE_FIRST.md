# Phase 1933 — Controller Dataflow Correlation Bundle (Interface First)

## Trace finding

Phase 1932 bound one local `sourceFile` in the Laravel controller analyzer, but the semantic authority input still exposed `semanticKnowledgeProjection`, `statementPayloads`, and `invocationJudgment` as independently replaceable top-level fields. The documented invariant therefore remained weaker at the actual authority boundary than the scanner construction path.

## Interface-first change

- Added `ControllerDataflowSourceCorrelationInterface<Payload>` to the existing upstream authority contract. It packages the canonical `sourceFile`, exact invocation judgment, knowledge projection, and statement payload evidence as one value.
- Changed `ControllerDataflowSemanticJudgmentAuthorityInput` to accept `sourceCorrelation` rather than three independent fields.
- Updated the authority to consume and return the projection and judgment through the bundle, while payload correspondence consumes payload evidence from that same bundle.
- Updated the Laravel controller analyzer to build the bundle from the one `judgment.sourceFile` already bound before evidence collection.
- Advanced authority contract version to 7 and Laravel scanner boundary version to 95.
- Updated the Phase 1930–1932 targeted audits and registered the Phase 1933 audit.

## Semantic boundary

This is a typed boundary improvement, not a claim that TypeScript proves reference identity between nested `sourceFile` values. The bundle prevents callers from independently supplying the three evidence families as separate authority-input properties; consistency of nested provenance is still governed by the existing canonical-source construction contract. No parallel semantic authority or `semantic/foundation` dependency was introduced.

## Verification

The Phase 1933 static audit is intended to check the bundle contract, analyzer construction, authority consumption, version coherence, and architectural exclusions. Build and full TypeScript compilation are not run in this environment.
