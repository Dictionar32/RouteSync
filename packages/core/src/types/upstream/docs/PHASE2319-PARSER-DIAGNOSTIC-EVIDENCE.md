# Phase 2319 — PHP parser diagnostic evidence ADT

## Finding
Phase 2318 made parser rejection a blocked coverage outcome, but its failure arm only carried a discriminator. The CLI could not preserve the parser message or a reliable source location, which made the blocker harder to diagnose without adding semantic interpretation downstream.

## Interface-first change
- Evolved the existing `PhpSourceFrontendParserFailureDiagnostic` contract in `phpSourceFrontendInterface.ts`; no duplicate v2 interface was introduced.
- Added closed diagnostic alternatives for an available parser error message and a diagnostic that is unavailable.
- Added a closed location ADT: a one-based line/column pair when both are present and valid, otherwise an explicit unavailable arm.
- `php_source_frontend_parser_rejected_source` now carries the diagnostic ADT.
- Advanced `PHP_SOURCE_FRONTEND_CONTRACT` from version 6 to 7 and declared the diagnostic-preservation rule.
- The adapter only transports parser evidence. It does not reinterpret the error as invocation semantics, and no partial AST is accepted after the parser throws.

## Trace
`PhpSourceDocument` → `PhpSourceFrontendInterface.extract` → parser throws → `PhpSourceFrontendParserFailureDiagnostic` → `php_source_frontend_parse_blocked` → `PhpSourceFrontendExtractionValidationAuthority` → incomplete validation → invocation pipeline blocked before name resolution and semantic judgment.

## Limits
- The adapter preserves `Error.message`; line and column are preserved only when the thrown error exposes numeric `lineNumber` and `columnNumber` values greater than zero.
- A thrown non-`Error` value maps to the explicit diagnostic-unavailable arm.
- This phase does not claim the full CLI/runtime executor path is free of semantic decisions. The Laravel AST pipeline and manifest builder remain separate audit targets.

## Validation
Run `node scripts/audits/audit-phase2319-parser-diagnostic-evidence.cjs`. This is a structural audit. It is not a full project typecheck, build, or end-to-end integration test.
