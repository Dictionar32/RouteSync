# Phase 2270 — PHP AST expression authority ownership

## Root cause

The existing `PhpAstExpressionSemanticAuthorityInterface` was already adequate for the consumers, but its concrete implementation and the shared AST-to-IR mapping helpers were owned by `subscanners/resource`. The same mapper was used by controller, provider, service, model, request, and resource paths. This was an ownership mismatch, not a missing generic interface.

## Changes

- Moved the canonical PHP AST expression authority implementation to `compiler/frontend/php/routeAst/phpAstExpressionSemanticAuthority.ts`, the parser-specific frontend owner.
- Moved its shared mapping and closure projection helpers beside that implementation.
- Renamed the public projection operations to `projectPhpAstExpressionToUpstream` and `projectPhpStatementsToSourceStatements` to remove resource-only naming from shared PHP frontend behavior.
- Rewired source consumers, including controller return projection and controller variable semantic runtime binding, to the canonical frontend owner.
- Emptied the three former resource-owned implementation modules rather than deleting them.
- Reused `PhpAstExpressionSemanticAuthorityInterface`; no new generic, parallel authority, `semantic/foundation` dependency, or authority V2 was added.

## Trace

`PHP AST → lexer/routeAst/phpAstExpressionSemanticAuthority → Expression ADT → existing controller/dependency/return/service/provider/resource consumers`.

The interface remains declared in `types/upstream/phpAstExpressionSemanticAuthorityInterface.ts`; the PHP AST-specific implementation is now owned by the PHP frontend, where the parser evidence is available.

## Remaining debt

This phase corrects ownership and import direction, but it does not claim the entire expression implementation is free of `semantic/relations` or that all source consumers are pure projection-only executors. The mapper still contains relation-based AST-to-IR mapping and special handling such as attribute factory recognition. Those are separate semantic-model migrations and must not be hidden by adding another wrapper interface. No build, type-check, or Vitest run is claimed.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — compiler analyses should consume interface contracts rather than encode knowledge of concrete operation implementations.
- TypeScript unions and narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html — discriminated unions model closed variants explicitly; they do not replace correct ownership of semantic derivation.
