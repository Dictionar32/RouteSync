# Phase 354 — Legacy File Erasure

Files explicitly classified as obsolete compatibility artifacts are now physically empty rather than retaining a second semantic implementation.

Erased files:
- `packages/core/src/compiler/scanner/lexer/routeAst/syntaxNavigation.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/phpAstSyntaxEvidenceRelationProgram.ts`

The canonical semantic path remains relation-first:

`Presence -> Evidence Relations -> Constraint Relations -> Fixed Point -> Rewrite Closure`

No deleted file is permitted to regain semantic authority. If a future consumer needs the capability, it must consume the canonical relational authority instead of restoring the old implementation.

Important: this phase does not claim the entire repository is construct-free. Remaining legacy parser/data-flow compatibility files are tracked for subsequent erasure/cutover.
