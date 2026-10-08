# Phase 371 — Semantic Rewrite Authority

## Goal

Raise rewrite/saturation to a first-class semantic authority so the remaining
legacy scanner/resolver code can be migrated by meaning rather than by lexical
substitution.

## Canonical path

source evidence → semantic relations → candidate constraints → rewrite rules →
fixed-point closure → semantic witness → downstream artifact

The canonical rewrite engine is:

`packages/core/src/semantic/kernel/semanticRewriteEngine.ts`

It provides:

- `RewriteRule<T>`: declarative pattern + rewrite relation.
- `rewriteOnce`: produces a rewrite witness or absence relation.
- `applyRewrite`: resolves the first admissible rewrite relation.
- `saturateRewrite`: repeatedly applies the relation and records witnesses until
  fixed-point convergence or the configured bound.

## Eradication rule

Do not replace forbidden constructs with lexical disguises such as `void 0`,
`Object.is` everywhere, or assertion casts. Presence, equality, refinement,
selection, projection, aggregation, expansion, fallback, and rewrite closure
must remain semantic relations.

Source-language tokens such as PHP `null`, `if`, `for`, `while`, and `switch`
remain data/evidence when they describe the source program. They must not become
host TypeScript control-flow authority.

## Gate

Phase 370's canonical authority gate remains zero for:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`,
`undefined`, host `null`, `===`, `!==`, TypeScript `as`, and TypeScript
`unknown`.

Phase 371 adds a reservoir audit over semantic/scanner implementation files.
The audit is intentionally non-zero: it identifies the legacy implementation
surface that must be migrated next. It is not treated as proof of completion.
