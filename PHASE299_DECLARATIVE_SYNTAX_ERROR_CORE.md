# Phase 299 — Declarative Syntax and Error Core

Phase 299 extends the relational execution boundary into compiler syntax navigation and diagnostic aggregation.

## Architecture

```text
concrete source syntax
        |
        v
syntax/evidence boundary
        |
        v
syntax relations
        |
        v
relational navigation runtime
        |
        +--> semantic relation compiler
        |
        +--> diagnostics relation
```

The following infrastructure now uses recursive relational sequence primitives rather than host collection traversal or imperative control constructs:

- `packages/core/src/compiler/relational/sequence.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/tokenCursor.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/syntaxRange.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/syntaxScan.ts`
- `packages/core/src/compiler/diagnostics/DiagnosticBag.ts`

The semantic adapter, semantic solver, rewrite engine, closure engine, and canonical semantic production surface retain the Phase 297 relational boundary.

## Declarative runtime vocabulary

- `walkRelation`
- `projectRelation`
- `selectRelation`
- `expandRelation`
- `distinctRelation`
- `firstRelation`

These are relational execution primitives. They are not aliases for JavaScript collection methods.

## Boundary rule

Concrete grammar recognition remains evidence production. It is not promoted into semantic ontology or semantic execution state.

## Audit scope

The Phase 299 lexical audit covers the parser adapter, semantic execution engines, syntax navigation core, syntax range/scan infrastructure, and compiler diagnostic aggregation core.

The broader legacy controller parser and low-level tokenizer still contain ordinary parser implementation mechanics. They are intentionally not reported as clean until they can be migrated without merely disguising imperative traversal.
