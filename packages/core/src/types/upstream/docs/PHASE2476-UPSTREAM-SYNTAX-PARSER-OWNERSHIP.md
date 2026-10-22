# Phase 2476 — Upstream Syntax Parser Ownership

## Scope

This phase corrects the Phase 2475 continuation without relocating `modelPropertyAstParser.ts` into `lexer`. It reuses the already-existing `SourceAstSyntaxParserInterface` and adds a typed `parseProperties` operation to that contract. The implementation is owned by the existing `sourceAstSyntaxParser` in `compiler/semantic`, and the Laravel model scanner, resource source evidence, and FormRequest scanner call that operation.

## Changes

- Added `parseProperties(tokens)` to `SourceAstSyntaxParserInterface<MethodSyntax, PropertySyntax, TokenSyntax>`.
- Integrated the existing model-property syntax recognition into `sourceAstSyntaxParser.ts`.
- Rewired the three direct consumers to `sourceAstSyntaxParser.parseProperties(tokens)`.
- Deleted `scanner/subscanners/model/modelPropertyAstParser.ts`; no copy was added to `scanner/lexer`.
- Updated the phase 1409, 2460, and 2470 audits to follow the existing contract.
- Added `audit:phase2476-upstream-syntax-parser-ownership`.

## Architecture boundary

The syntax parser still uses the repository's current PHP token/AST vocabulary and its existing method parser. This phase retires one parser from `subscanners`; it does **not** claim that the entire `subscanners` or `lexer` directories have been retired. Those directories have broad consumers and need a separate, dependency-traced migration to existing upstream syntax/evidence contracts before safe deletion. No new parallel parser interface, lexer file, semantic authority, or `semantic/foundation` import was introduced.

## Verification status

Run the focused static audit and existing phase audits in this workspace. Full typecheck, Vitest, package build, and end-to-end CLI validation are not claimed unless their commands complete successfully in this environment.
