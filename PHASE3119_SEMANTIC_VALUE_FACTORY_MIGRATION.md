# Phase 3119 — Semantic Value Factory Interface Migration

This phase performs an implementation migration, not an audit-only checkpoint.

## Migrated upstream constructors

In `packages/core/src/types/upstream/semanticDataflowKnowledge.ts`, five direct exported arrow factories were migrated to named, explicit operation interfaces and frozen operation objects:

- `semanticText` → `SemanticTextFactoryInterface.create`
- `semanticNumber` → `SemanticNumberFactoryInterface.create`
- `semanticBoolean` → `SemanticBooleanFactoryInterface.create`
- `semanticSourceOffset` → `SemanticSourceOffsetFactoryInterface.create`
- `semanticSourceSpan` → `SemanticSourceSpanFactoryInterface.create`

All package TypeScript consumers now invoke these constructors through `.create(...)`. Source-span construction delegates endpoint construction to the source-offset ADT factory. The source identity and the semantic `kind`/`value` distinctions remain unchanged.

## Static CJS gate

Run:

```bash
NODE_PATH=/opt/nvm/versions/node/v22.16.0/lib/node_modules node scripts/audits/test-phase3119-semantic-value-factory-migration.cjs
```

The gate uses the TypeScript AST, does not import project runtime modules, and does not use Vitest. It checks the named interface, exported annotation, `create` operation, parseability of package TypeScript files, and absence of legacy direct-call syntax for the five migrated factories.

## Scope and limits

This migrates five upstream constructors and their consumers. It does not claim that every exported function/arrow in the repository has been migrated, nor that all primitive types/control flow have been eliminated. Such changes require domain-by-domain migration to preserve PHP/Laravel semantics and datum provenance.
