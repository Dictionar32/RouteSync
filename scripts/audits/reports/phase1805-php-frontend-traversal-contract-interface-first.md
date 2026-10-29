# Phase 1805 — PHP Frontend Traversal Contract (Interface-First)

## Trace finding

The active Laravel scanner tokenizer (`packages/core/src/compiler/frontend/php/tokenizer.ts`) is a lexical scanner, while `phpMethodParser.ts` parses a method-level construct. Neither file constitutes a whole-file PHP AST frontend that inventories namespace regions, imports, named function declarations, all function calls, and arguments. The existing `PhpSourceFrontendInterface` had no typed traversal provenance to distinguish these scopes, so coverage labels alone could claim more than the current parser proves.

## Interface-first changes

- Evolved `PhpSourceFrontendContract` to v3.
- Added `PhpSourceFrontendTraversalEvidence`, a closed union distinguishing a whole-file AST traversal witness from partial token/method-body traversal evidence.
- Required every `PhpSourceFrontendExtraction` to carry traversal evidence bound to the same source file and full source span.
- Evolved extraction validation contract to v5.
- Added typed validation violations for traversal provenance mismatch, incomplete traversal obligations, unvisited syntax families, and complete coverage claimed from partial traversal.
- Validation now only reports `completeness: 'complete'` when coverage, name-resolution inventory, invocation inventory, and whole-file traversal witness are all complete.
- Updated Phase 1803/1804 static audits to assert the evolved contract.
- Fixed a duplicate local binding in pipeline authority found during trace (`invocationInventory`) by naming the syntax inventory binding `invocationSyntaxInventory`; this is a correctness fix, not a migration target.

## Boundaries preserved

- No PHP parser adapter was invented or falsely marked complete.
- No semantic name resolution was moved into the frontend.
- No new dependencies on `semantic/foundation` or `semantic/relations` were added.
- Runtime was not treated as the migration destination; this phase evolves the source-evidence contract and its validator.

## Audit results

- Phase 1805 audit: 16/16 passed.
- Phase 1804 regression audit: 16/16 passed.
- Phase 1803 regression audit: 12/12 passed.
- Build/typecheck not run, per repository workflow constraint.

## Remaining work

Implement an adapter around a real whole-file PHP AST/parser and have it produce the traversal witness and source inventories. Until then, the current tokenizer/method parser must not claim whole-file frontend completeness. Then wire its validated output into the existing pipeline and integrated response, migrate old subscanner consumers, and remove obsolete subscanners only after their consumers have moved.
