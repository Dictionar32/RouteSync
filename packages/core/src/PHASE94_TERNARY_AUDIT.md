# Phase 94 — Ternary Audit & Knowledge Elevation

## Prinsip

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

Audit ini menargetkan ternary (`condition ? a : b`) pada semantic layer RouteSync. Perubahan bukan sekadar penggantian sintaks: keputusan yang memiliki makna Laravel dipindahkan ke ADT/catalog.

## Laravel grounding

Audit digrounding pada Laravel 13.x Routing dan Controllers documentation.

Laravel mendefinisikan:

- implicit model binding berdasarkan kecocokan nama route parameter dan type-hint model;
- custom binding key dan nested scoped binding;
- `withTrashed()` untuk implicit model binding;
- resource action profiles untuk `resource`, `apiResource`, `singleton`, dan `apiSingleton`;
- resource `withTrashed()` default/selected actions;
- resource middleware dengan `middleware`, `middlewareFor`, dan `withoutMiddlewareFor`;
- `only()` / `except()` action selection.

## Ternary findings

### 1. Middleware scope applicability

Sebelumnya knowledge tersembunyi di ternary:

- action absent vs present;
- scope `all` vs `only` / `except`.

Sekarang:

```text
Presence<ActionName>
        ↓
action-key catalog
        ↓
scope action catalog
        ↓
applicability matrix
```

`middlewareScopeApplicability()` hanya melakukan lookup terhadap data model.

### 2. Resource middleware name

Sebelumnya ternary memilih hasil `name` dari optional split.

Sekarang `Presence` didispatch melalui handler catalog. Tidak ada keputusan Laravel baru di flow.

### 3. Resource `withTrashed` cardinality

Laravel membedakan:

- `withTrashed()` → default resource actions;
- `withTrashed([...])` → selected actions.

Cardinality sekarang menjadi ADT generik:

```text
Cardinality = empty | non_empty
```

`resolveWithTrashed()` memilih semantic profile berdasarkan cardinality data, bukan ternary.

### 4. `whereIn()` cardinality

`whereIn()` juga memakai `Cardinality`.

```text
absent       → unresolved(missing_values)
empty        → unresolved(missing_values)
non_empty    → in(values)
```

Mapping method Laravel tetap berada di `CONSTRAINT_RESOLVER_CATALOG`.

### 5. Controller middleware normalization

Ternary object-vs-name pada middleware resolver dipindahkan menjadi normalizer dengan structural type guard. Ini bukan pengetahuan Laravel action; ia hanya normalisasi representasi input.

## Presence additions

`presence.ts` sekarang memiliki:

- `Presence<T>` untuk presence yang membawa value;
- `FlagPresence` untuk flag presence tanpa payload;
- `fromBooleanFlag()` untuk mengangkat boolean parser flag menjadi ADT;
- `Cardinality` dan `cardinalityOf()` untuk memodelkan cardinality collection.

Dengan demikian `withTrashed` tidak dipaksa menjadi `Presence<undefined>` atau payload semu.

## Result

Semantic layer:

- real ternary operators: **0**;
- `=== undefined` / `!== undefined`: **0**;
- numeric semantic index dependency: **0**;
- `findIndex`: **0**;
- `.at(...)`: **0**.

The remaining `?` tokens are TypeScript optional properties/parameters or the non-capturing optional regex syntax in the route parameter parser. They are not ternary operators.

## Validation limitation

Changed-file TypeScript validation reaches the existing archive boundary but the workspace still lacks the baseline `phpAstTypes` module. Therefore this phase does **not** claim a full workspace compile.

## Temporary files

Files designated as disposable remain present and empty; they are not deleted:

```text
packages/core/src/types/upstream/routeResourceFacts.ts.tmp
packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationAst.ts.tmp
```
