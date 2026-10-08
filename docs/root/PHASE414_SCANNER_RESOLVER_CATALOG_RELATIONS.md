# Phase 414 — Scanner/Resolver Catalog Authority → Relations

Phase 414 continues the scanner/lexer and resolver migration toward declarative semantic relations + solver/rewrite dispatch.

## Research basis

- MLIR PDLL separates match and rewrite sections and represents pattern rewrites declaratively.
- MLIR PDL represents pattern matching/rewrite as an IR-level abstraction.
- Soufflé models semantic facts as typed relations.
- egglog combines equality saturation with Datalog.
- JastAdd demonstrates declarative circular fixed-point evaluation for data-flow/reachability.

These systems support the architectural direction: scanner/resolver dispatch should produce/query relations and witnesses, while a solver/rewrite layer decides which semantic candidate is applicable.

## Concrete change

`queryEvidenceProducer.ts` no longer performs the `operationCatalog` lookup through direct `Map.get(...)?(...)` authority. The catalog is queried through `relationLookup(...)`, then projected through `relationOptionFold(...)`.

This is deliberately a small, type-preserving migration rather than a blind syntax codemod.

## Remaining frontier

The same file still contains legacy optional/sentinel semantics in older resolver rules. Those require a broader `RelationOption` contract migration and must not be hidden by textual substitutions. The next phase should migrate the named-method catalog and operation-rule return contracts together.
