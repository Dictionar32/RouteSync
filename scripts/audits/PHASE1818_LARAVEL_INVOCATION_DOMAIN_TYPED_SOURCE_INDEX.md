# Phase 1818 — Domain-Typed Invocation Pipeline Source Index

## Why this phase exists

Phase 1817 exposed `RelationIndex<string, PhpSourceInvocationSemanticPipelineResult>` across manifest-builder and scanner boundaries. That made a path string the public identity contract and leaked a generic tuple-index representation into the invocation pipeline API. This conflicts with RouteSync's source-domain typing goal.

## Interface-first correction

Introduced `PhpSourceInvocationSemanticPipelineResultIndex` as a named upstream contract. Each entry is a `PhpSourceInvocationSemanticPipelineResultBinding` containing a domain `SourceFile` and the existing closed `PhpSourceInvocationSemanticPipelineResult`.

The public `ManifestBuilderInterface`, `LaravelSourceAstScannerInterface`, and `LaravelSourceAstPipelineInterface` now accept the named index contract. The CLI batch adapter returns that contract; `ControllerScanner` resolves an entry using a `SourceFile` value rather than passing a raw path string to a generic `RelationIndex` lookup.

The semantic result union remains unchanged: complete and blocked pipeline outcomes retain their original types. Missing injected input still maps to the explicit `not_connected` evidence. No `semantic/foundation` dependency was added.

## Scope and limitations

This phase corrects the public type boundary; it does not claim that `SourceFile` is a content fingerprint. The current identity remains path-based inside the `SourceFile` value object. Content identity and single-read provenance should be modeled separately if the source-frontend contract requires protection against file mutation between reads.

## Verification

Static audits cover the new domain index, public contracts, CLI batch result, active scanner lookup, and absence of the generic string-keyed invocation index. Build and full typecheck are intentionally not run in this environment.
