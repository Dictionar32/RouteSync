# Phase 228 — Control-Flow Audit: `if`, `while`, `switch`, `for`

## Tujuan

Audit ini memeriksa apakah control flow masih menjadi tempat penyimpanan pengetahuan semantik, sesuai prinsip RouteSync:

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

Audit **tidak** menganggap semua `if`, `while`, `switch`, atau `for` sebagai masalah. Control flow tetap valid untuk mekanika parser, traversal, validation, worklist solver, caching, dan type narrowing.

## Baseline checkpoint

Phase 227 — Semantic Heap Versioning.

### Hitungan non-test `packages/core/src`

| Construct | Count |
|---|---:|
| `if` | 2364 |
| `while` | 149 |
| `switch` | 272 |
| `for` | 581 |

### `routeAst` non-test

| Construct | Count |
|---|---:|
| `if` | 101 |
| `while` | 18 |
| `switch` | 2 |
| `for` | 40 |

Angka tersebut adalah **audit inventory**, bukan target untuk menjadi nol.

## Klasifikasi

### A. Evidence / syntax decoding — DIPERTAHANKAN

Contoh:

- `phpAstSemanticKnowledgeDataFlowAdapter.ts`
- `astClassifier.ts`
- `tokenCursor.ts`
- `syntaxScan.ts`

Branch seperti:

```ts
if (value.kind === 'literal') ...
if (target.kind === 'property') ...
```

berfungsi menginterpretasikan evidence dari parser/AST menjadi semantic facts. Branch tersebut bukan semantic source of truth; outputnya adalah typed knowledge.

### B. Type narrowing / representation mechanics — DIPERTAHANKAN

Contoh:

```ts
if (fact.kind === 'assignment') ...
```

ketika digunakan untuk mempersempit discriminated union TypeScript. Ini bukan keputusan domain; ini operasi atas representasi data.

### C. Solver / fixed-point mechanics — DIPERTAHANKAN

Contoh utama:

```ts
while (queue.length > 0) { ... }
```

pada `semanticKnowledgeLattice.ts`.

`while` tersebut adalah mekanisme worklist. Pengetahuan semantik datang dari `SemanticDataFlowFact`; loop hanya menjalankan solver sampai fixed point.

Hal yang sama berlaku untuk queue/worklist pada demand-driven, sparse, context-sensitive, dan heap analysis.

### D. Validation / invariant enforcement — DIPERTAHANKAN

Branch yang memeriksa:

- canonical fact references
- duplicate artifact
- missing provider
- impossible state
- invalid contract

adalah enforcement terhadap invariant model, bukan penyimpanan pengetahuan domain.

### E. Semantic decision masih tersimpan dalam branch — TARGET REFACTOR

Audit menemukan beberapa pola yang masih layak dinaikkan menjadi knowledge/catalog relation.

#### 1. Assignment operator → memory effect

`semanticMemoryDependence.ts` masih memiliki pola:

```ts
assignment.operator.code === 'set'
  ? 'write'
  : 'read-write'
```

Masalahnya bukan `if`-nya. Masalahnya adalah hubungan:

```text
assignment operator → memory effect
```

masih didefinisikan oleh branch consumer.

Target:

```text
SemanticAssignmentOperatorDefinition
        ↓
SemanticAssignmentEffectKnowledge
        ↓
read / write / read-write
```

Consumer cukup membaca fact tersebut.

#### 2. Assignment reference → alias relation

`semanticObjectIdentity.ts` masih memeriksa:

```ts
fact.value.reference.code === 'by_reference'
```

Targetnya adalah menaikkan:

```text
assignment reference
        ↓
AliasKnowledge
```

sehingga analyzer tidak mengetahui detail kode `by_reference` sebagai aturan domain.

#### 3. Interprocedural role lookup

`semanticInterproceduralDataFlow.ts` masih mem-filter role dengan literal semantic code seperti `callable`.

Target:

```text
SemanticRelationDefinition
        ↓
CallableBoundaryKnowledge
```

Consumer bekerja terhadap relation/knowledge definition, bukan literal code.

#### 4. Choice/repetition catalog lookup

Adapter masih melakukan `.find(item => item.code === 'conditional')`, `condition`, `iteration`, `counted`, dan sejenisnya.

Dalam adapter, ini masih relatif aman karena adapter memang menerjemahkan evidence → semantic data. Namun catalog lookup sebaiknya dipusatkan pada typed constructors/definitions agar literal semantic codes tidak tersebar.

## `switch` audit

`switch` pada compiler utama dan type system umumnya merupakan dispatch atas discriminated union atau representation kind. Ini **bukan** pelanggaran prinsip semantic-data-first selama setiap case tidak menjadi sumber pengetahuan domain yang seharusnya berupa data.

Contoh aman:

```ts
switch (type.kind) {
  case 'primitive': ...
  case 'reference': ...
}
```

Contoh yang perlu diaudit:

```ts
switch (someString) {
  case 'special-framework-rule': ...
}
```

jika string tersebut sebenarnya merepresentasikan knowledge yang belum dimodelkan.

## `while` audit

`while` ditemukan terutama pada:

- compiler pass scheduling
- fixed-point solver
- demand-driven traversal
- sparse propagation
- token scanning

Ini **mekanika**, bukan semantic authority.

Yang harus dihindari adalah:

```text
while
  └── menemukan aturan domain baru secara ad-hoc
```

Yang diinginkan:

```text
semantic knowledge
      ↓
while/worklist solver
      ↓
derived result
```

## Kesimpulan audit

Tidak ada dasar untuk melakukan refactor massal `if → data` atau menghapus `while`/`switch` secara mekanis.

Masalah nyata yang tersisa adalah lebih sempit:

```text
literal semantic code
        ↓
consumer branch
```

harus terus dipindahkan menuju:

```text
semantic definition/catalog
        ↓
knowledge relation/fact
        ↓
consumer
```

### Prioritas berikutnya

1. Assignment operator → `SemanticMemoryEffectKnowledge`
2. Assignment reference → `SemanticAliasKnowledge`
3. Callable relation → typed `SemanticCallableBoundary`
4. Central typed constructors untuk choice/repetition definitions
5. Re-audit seluruh consumer setelah perubahan tersebut

## Prinsip akhir

Target RouteSync bukan:

> `if = buruk`

Targetnya:

> **Semantik tidak boleh hidup hanya di dalam branch control-flow.**

Control flow tetap boleh menjadi interpreter/solver mekanis. Pengetahuan yang menentukan *apa arti sesuatu* harus dapat direpresentasikan, dihubungkan, difusikan, dan dianalisis sebagai data.
