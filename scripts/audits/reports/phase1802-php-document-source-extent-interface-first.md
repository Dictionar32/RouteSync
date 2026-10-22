# Phase 1802 — PHP document source extent, interface-first

## Trace

- `phpSourceFrontendInterface.ts` defines a whole-file extraction contract.
- `phpSourceFrontendExtractionValidationAuthorityInterface.ts` previously required a valid span and matching source-file identity, but did not require the span to cover the actual `PhpSourceDocument.content` extent.
- `phpSourceFrontendExtractionValidationAuthority.ts` validates extraction before source inventory and semantic authorities in `phpSourceInvocationSemanticPipelineAuthority.ts`.
- `controllerDataflowAnalyzer.ts` exposes a pipeline-result entry point, but the existing Laravel tokenizer/parser is not yet implemented as a `PhpSourceFrontendInterface` adapter. End-to-end source integration therefore remains incomplete.

## Change

- Evolved `PhpSourceFrontendExtractionValidationContract` from version 1 to version 2.
- Replaced the vague whole-file-span rule with `bind-whole-file-span-to-exact-document-content-extent`.
- Added the typed `whole-file-span-does-not-cover-document-content` violation with a domain-typed document length.
- The validation authority now requires source span start offset `0` and end offset equal to the document content length before downstream semantic authorities may consume the extraction.
- Kept the pipeline's existing blocked-result behavior; no incomplete parser output is upgraded to complete.

## Verification

- Phase 1802 focused static audit: 10/10.
- Phase 1801 regression audit: 17/17.
- Phase 1800 regression audit: 17/17.
- Phase 1799 regression audit: 16/16.
- Build and typecheck were not run.

## Remaining work

Implement a real adapter from the active Laravel PHP parser/tokenizer to `PhpSourceFrontendInterface`, including complete namespace-region, imports, function declaration, call, argument, and source-span evidence. Then wire it through the already-existing pipeline and publish only validated invocation judgments to integrated response. Migrate consumers before removing old subscanners.
