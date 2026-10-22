# Phase 1816 — Laravel invocation pipeline scanner injection

## Trace before the change

`CLI whole-file pipeline authority -> no source-keyed input at core scanner -> ControllerScanner tokenizes source -> controller declaration -> method-body parser -> controller body analyzer -> integrated response`

The pipeline existed, but the active Laravel scanner was hardwired to `php_source_invocation_pipeline_not_connected`. The source-binding judgment introduced in Phase 1815 was not threaded through the active parser chain.

## Interface-first change

The source-AST pipeline and scanner interfaces now accept an optional `RelationIndex<string, PhpSourceInvocationSemanticPipelineResult>` keyed by the canonical `SourceFile` path. The controller scanner looks up the result for each controller file, applies `phpSourceInvocationSemanticSourceBindingAuthority`, and passes the resulting closed composition evidence through:

`ControllerScanner -> LaravelSourceLexer.parseControllerDeclaration -> parseControllerMethod -> parseControllerBody -> analyzeControllerDataflowWithIntegratedResponse -> invocationSemanticIntegratedResponseComposition`

The core scanner does not import CLI. CLI now exports `analyzePhpSourceInvocationSemanticPipelineBatch(documents)`, which analyzes each supplied whole-file document once and returns the source-keyed index expected by the core scanner. The caller at the composition root must pass this index to `scanSourceAsts`/`laravelSourceAstPipeline.execute` to activate the connected path.

## Semantics preserved

- Missing source-keyed input remains `php_source_invocation_pipeline_not_connected`.
- A result whose document source identity differs from the controller file becomes `php_source_invocation_pipeline_source_binding_rejected`.
- Complete and blocked source-pipeline outcomes remain distinct through the existing integrated-response projection.
- The method/body parser receives existing whole-file semantic evidence; it does not re-run whole-file invocation analysis.
- No `semantic/foundation` dependency was introduced.

## Scope and verification

This phase implements the injection boundary and parser threading. It does **not** silently auto-create PHP documents inside core: the composition root must provide frontend-produced documents, run the CLI authority batch, and pass its result index into the scanner. This avoids a core-to-CLI dependency and keeps frontend parsing authority at the CLI boundary.

Static audits: Phase 1816, Phase 1815, and Phase 1814. No full build or typecheck was run.
