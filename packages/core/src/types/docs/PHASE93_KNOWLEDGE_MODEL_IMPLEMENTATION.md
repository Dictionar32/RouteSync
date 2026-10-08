# Phase 93 — Knowledge Model Implementation

## Prinsip

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

## Laravel 13 grounding

Laravel resource registration mempunyai semantic profiles berbeda untuk `resource`, `apiResource`, `singleton`, dan `apiSingleton`. Resource actions, `withTrashed`, scoped nesting, shallow nesting, singleton creation/destruction, dan middleware per-action merupakan bagian dari registration semantics.

Laravel routing juga mempunyai implicit model/enum binding, nested binding scoping, route constraints, dan missing-model behavior.

## Implementasi

### Binding knowledge catalog

`routeBindingKnowledgeCatalog.ts` mematerialisasikan:

- target kind berdasarkan identity/presence model dan enum
- `withTrashed` applicability
- binding scoping berdasarkan target, parent-model relation, binding key, dan group scope

Resolver binding tidak lagi menghitung aturan Laravel dengan switch/if berdasarkan posisi.

### Constraint knowledge catalog

`routeConstraintKnowledgeCatalog.ts` mematerialisasikan mapping method Laravel:

- `where`
- `whereNumber`
- `whereAlpha`
- `whereAlphaNumeric`
- `whereUuid`
- `whereUlid`
- `whereIn`

ke semantic matcher.

`whereIn` enum cases tetap direpresentasikan sebagai `enum_cases`, bukan diubah menjadi literal atau dibuang.

### Middleware applicability relation

`routeMiddlewareKnowledgeCatalog.ts` mematerialisasikan applicability berdasarkan:

- `all`
- `only`
- `except`
- action identity

Perbandingan parameter middleware menggunakan identity key, bukan pasangan array berdasarkan index.

### Resource semantic model

Resource nesting, selection, middleware scope, singleton creation/destruction, dan `withTrashed` tetap berada di upstream resource model/catalog.

### Temporary files

File yang sudah tidak dipakai **tidak dihapus**. File tersebut dipertahankan dengan ukuran `0 byte`:

- `types/upstream/routeResourceFacts.ts.tmp`
- `compiler/scanner/lexer/routeAst/routeDeclarationAst.ts.tmp`

## Invariants

- No semantic `findIndex()`.
- No semantic numeric index lookup.
- No semantic `??` fallback.
- No semantic Laravel `switch` for binding/constraint/middleware knowledge.
- Descriptor layer tetap tidak digunakan sebagai semantic interface.
- Flow menerima semantic contracts, bukan AST.
- Temporary artifacts yang dibuang tetap dipertahankan sebagai file kosong.

## Validation

Changed-file TypeScript check: PASS.

Full workspace TypeScript check: NOT CLAIMED. Archive baseline masih kehilangan beberapa dependency/source (`route.ts`, PHP AST helper, parser helper, test typings, dan dependency test runtime).
