# Phase 2318 — PHP parser rejection ADT

## Finding
`sourceFrontendAstAdapter.ts` caught parser errors and returned `php_source_frontend_coverage_incomplete`. That made parser rejection look like ordinary missing evidence, even though no usable AST had been produced.

## Change
- Evolved the existing `PhpSourceFrontendCoverage` union with `php_source_frontend_parse_blocked`.
- The blocked arm preserves source identity/span and a closed `php_source_frontend_parser_rejected_source` failure discriminator.
- Advanced `PHP_SOURCE_FRONTEND_CONTRACT` to version 7 and clarified its failure rule.
- Parser catch now returns the blocked coverage arm. Existing validation classifies this as incomplete, so the invocation pipeline stops before name resolution and judgment closure.
- No new semantic authority, generic wrapper, `semantic/foundation`, or `semantic/relations` dependency was added.

## Trace
`PhpSourceDocument` → `PhpSourceFrontendInterface.extract` → parser blocked coverage ADT → `PhpSourceFrontendExtractionValidationAuthority` → validated-but-incomplete extraction → `PhpSourceInvocationSemanticPipelineBlocked(stage: frontend_coverage)`.

## Validation
Run `node scripts/audits/audit-phase2318-parser-rejection-adt.cjs`. This is a structural audit, not a full project typecheck or integration test.
