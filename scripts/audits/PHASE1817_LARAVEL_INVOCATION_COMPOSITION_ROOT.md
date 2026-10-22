# Phase 1817 — Laravel Invocation Pipeline Composition Root

## Trace

`scan/sync/drift-audit CLI command → buildManifestWithInvocationPipeline → whole-file PhpSourceDocument[] → analyzePhpSourceInvocationSemanticPipelineBatch → source-file keyed pipeline result index → manifestBuilder.build(sourceProject, index) → LaravelSourceAstScanner → ControllerScanner → source-binding judgment → controller method/body projection → invocation integrated response`

## Interface-first changes

- `ManifestBuilderInterface.build` accepts the existing typed source-file keyed pipeline result index as an optional input. Existing non-CLI callers remain source-compatible and retain explicit `not_connected` evidence when they do not provide it.
- The core manifest builder forwards that input to `laravelSourceAstScanner`; core does not import the CLI parser.
- The CLI composition root creates a `PhpSourceDocument` for every PHP file under `app/Http/Controllers`, runs the existing batch authority once per document, and passes the result index to the core builder.
- `scan`, `sync`, and manifest drift audit now use the same composition root.

## Boundaries and known limitations

- This phase connects the production CLI caller to the pipeline path; it does not remove legacy controller subscanners or claim that all invocation categories are semantically modeled.
- Source binding currently verifies canonical source-file identity, not a content digest. The frontend and controller scanner still read file contents separately, so a file mutation between reads is a remaining provenance-hardening issue.
- The static audit checks wiring shape, not semantic runtime correctness. Build, typecheck, and end-to-end execution were not run in this environment.
