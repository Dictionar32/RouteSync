# Phase 635 — Unused Surface Vacuum + Declarative Boundary Audit

## Scope

This phase removes only an explicitly archived, non-runtime test surface whose own source documents that the legacy adapter has no active call sites. The path is preserved and truncated to zero bytes; no file is deleted.

## Vacuumed path

- `packages/cli/src/parsers/__tests__/legacyFieldAdapter.test.ts`

Reason: archival documentation test for `legacyFieldAdapter` rather than an active regression test. It imports only `PhpCodeParser`, and its own comments identify the legacy adapter as archived/dead against the current parser pipeline.

## Preservation rule

No deletion. The path remains present at exactly 0 bytes.

## Architecture direction

The active compiler continues to move semantic authority toward:

source evidence → relations → constraints → recursive closure/fixpoint → witnesses/provenance → rewrite rules → canonical semantic IR → target lowering → Next.js projection.

Parser/lexer mechanics remain evidence acquisition; source-language tokens such as PHP `null`, `??`, ternary, and route method vocabulary are not mechanically erased when they are required as source facts.

## Research basis

MLIR canonicalization applies registered rewrite patterns iteratively to a fixpoint and requires rewrites to converge while preserving recoverable semantics. MLIR declarative rewrite rules separate the semantic rewrite specification from imperative implementation boilerplate. Soufflé-style recursive relational evaluation and SCC/fixpoint computation provide the corresponding relation-side execution model.

## Validation

- deleted files: 0
- vacuumed files: 1
- vacuumed path byte size: 0
- workspace root preserved as `RouteSync/` when archived.
