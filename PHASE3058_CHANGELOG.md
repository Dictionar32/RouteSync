# Phase 3058 Changelog

- Added a required typed `PhpAstSemanticKnowledgeDataFlowProductionInput` containing PHP block, `SourceFile`, and `SemanticEvidenceProvider`.
- Changed the primary producer operation to accept one typed input object instead of positional optional path/provider arguments.
- Added upstream `semanticSource.createForFile` so source evidence is built from canonical `SourceFile` identity and explicit provider provenance.
- Restricted `semanticKnowledgeDataFlowProducer` to the typed `produceWithOutcome` operation.
- Isolated graph-only legacy convenience under `legacySemanticKnowledgeDataFlowProducer`; existing parser tests use this named compatibility adapter.
- Updated direct adapter tests to construct the explicit typed input.
- Added Phase 3058 audit and npm script.
- Did not restore deleted relation foundations; preserved the one-newline `collections.ts` invariant.
