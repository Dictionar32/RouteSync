# Phase 751 — Highest AST Authority + Dead Relation API Vacuum

## Diagnostic frontier

The authoritative local build reported a DTS error:

- `packages/core/src/compiler/passes/CompilationState.ts`
- stale import of `relationIndexEntries`
- `relationalSequence.ts` no longer exported that symbol

The trace showed that `CompilationState.ts` did not use `relationIndexEntries` at all. The only implementation was an identity projection in `relationMembership.ts`. The correct repair was therefore **not** to restore/re-export the symbol, but to remove the dead dependency and dead API.

## Structural repair

1. Removed the unused `relationIndexEntries` import from `CompilationState.ts`.
2. Removed the unused `relationIndexEntries` identity API from `relationMembership.ts`.
3. Promoted `PhpAstNode` from `packages/core/src/types/domain/phpAst` to the sole production syntax-node contract for the migrated core boundaries.
4. Replaced production `FieldNode` dependencies with canonical `PhpAstNode` dependencies in:
   - IR construction
   - semantic resolver metadata
   - model semantic assignments
   - model/resource entity contracts
   - route payload contracts
   - semantic kernel types
   - IR hints
   - selectRaw projection semantic resolver
5. Removed the old `FieldNode` catamorphism from the production export surface.
6. Emptied the now-unused legacy reservoirs only after the production reference audit proved they had no remaining core production consumers:
   - `packages/core/src/types/field.ts`
   - `packages/core/src/types/domain/fieldCatamorphism.ts`
7. Replaced the affected route path / HTTP verb host branching with relation-gated lookup and a canonical HTTP verb catalog.
8. Replaced the affected field-binding ternary with a relation judgment.
9. Added `scripts/audit-phase751-highest-ast-authority.cjs` and the package script `audit:phase751-highest-ast-authority`.

## Resulting authority

```text
Laravel scanner evidence
        |
        v
canonical PHP syntax ADT (PhpAstNode)
        |
        v
upstream AST semantic authority
        |
        +--> resolver graph
        +--> analysis / data-flow
        +--> semantic type lowering
        |
        v
semantic relation program
        |
        v
constraint / fixed-point closure
        |
        v
semantic rewrite engine
        |
        v
Next.js target projection
```

`FieldNode` / `ParsedField` is no longer a production core AST authority. The old files remain as zero-byte migration reservoirs rather than being deleted, preserving path stability while preventing legacy definitions from entering the build graph.

## Audit

`npm run audit:phase751-highest-ast-authority` passes with:

- `buildFrontierRelationIndexEntriesRemoved = true`
- `canonicalPhpAstIsProductionSyntaxAuthority = true`
- `legacyFieldSymbolsAbsentFromProduction = true`
- `legacyFieldFilesEmptyAfterReferenceAudit = true`
- `changedFilesHostConstructFree = true`

The changed TypeScript files were also syntax-checked through the TypeScript compiler API; 10 changed files were checked with zero syntax diagnostics.

Existing Phase 747, 748, and 750 audits were rerun and remained passing.

## Model research basis

The resulting boundary follows the strongest common structure found across declarative compiler/verification systems:

- CodeQL treats predicates as logical relations whose evaluations are tuple sets.
- MLIR PDLL/DRR separates pattern matching from rewriting and represents rewrite patterns declaratively.
- WebAssembly specifies validity as declarative typing constraints and separates the specification from the validation algorithm.
- Circular Reference Attribute Grammars express recursive semantic dependencies as fixed-point equations rather than imperative worklists.
- Datafrog represents relations as tuples and variables as monotonically increasing tuple sets.
- Laravel e-commerce systems demonstrate that route semantics are not isolated strings: real shop ecosystems connect routes with catalog/product, cart, checkout, orders, payments, authentication, admin, and resource flows.

## Next highest frontier

This phase deliberately does **not** claim that the whole repository is now free of host primitives or legacy descriptors. The next structural reservoirs are:

1. scanner/lexer route AST evidence adapters;
2. resolver graph boundary contracts;
3. CLI `parsed_ast` / old PHP parser algebra consumers;
4. controller/resource semantic data-flow surfaces;
5. semantic type lowering primitives;
6. diagnostic semantic payloads;
7. generic relational atoms still permitting primitive host values.

Those must be migrated by authority replacement, not by restoring compatibility exports or adding casts.
