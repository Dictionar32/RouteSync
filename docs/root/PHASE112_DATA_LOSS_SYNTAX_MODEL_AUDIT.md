# RouteSync — Phase 112 Data-Loss / Syntax-Model Audit

## Tujuan

Audit lanjutan dari Phase 111 dengan prinsip:

> Naikkan pengetahuan menjadi data model. Jangan menyimpan pengetahuan syntax/domain di control flow parser.

Traversal arithmetic harus tetap menjadi tanggung jawab model syntax navigation.

## Audit hasil

- `??` pada scanner: **0**
- `indexOf` / `findIndex` pada `routeAst`: **0**
- semantic positional access `[0]` / `[1]` pada `routeAst`: **0**
- raw token positional arithmetic di luar `TokenCursor`: **0**
- artefak `*.tmp` / backup pada `phase93`: **0** setelah cleanup
- `routeAst/*.ts` transpile dengan TypeScript: **PASS**

Positional arithmetic yang tersisa berada hanya di `TokenCursor`/`delimiterNavigation`, yaitu boundary yang memang memiliki ownership atas navigation state.

## Data-loss yang diperbaiki

### 1. `match([...])`

Sebelumnya pencarian array tidak terikat kuat pada argument call dan deduplikasi menggunakan callback index.

Sekarang:

```text
Route::match([...])
        ↓
callArgumentCursor
        ↓
delimitedElementSpans
        ↓
routeMethod catalog
        ↓
RouteTargetMethodSet
```

Set dipakai untuk identitas method, bukan posisi array.

### 2. Resource middleware

Bentuk Laravel seperti:

```text
middleware(['auth', 'verified'])
middlewareFor(['show', 'update'], ['auth', 'verified'])
withoutMiddlewareFor(['create', 'store'], 'verified')
```

sekarang dipertahankan sebagai kelompok data penuh.

Tidak lagi:

```text
actions[0]
middleware[0]
```

Model syntax menghasilkan:

```text
ResourceMiddlewareSyntax
├── middleware[]
└── actions[]
```

Scope `all | only | except` berasal dari catalog syntax method, bukan ternary di parser/factory.

### 3. Constraint

`where`, `whereIn`, dan helper constraint sekarang dikonversi menjadi `RouteConstraintSyntaxFact` di syntax model.

Parser hanya melakukan composition:

```text
SyntaxRange
  → routeConstraintFact
  → AST fact
```

Interpretasi Laravel tetap downstream.

## Traversal architecture

```text
TokenDescriptor[]
        ↓
TokenCursor
        ↓
DelimiterNavigation
        ↓
SyntaxRange / SyntaxNavigation
        ↓
Typed Syntax Fact
        ↓
Semantic Model
        ↓
Dumb Flow
```

`TokenCursor` adalah satu-satunya tempat yang boleh memiliki positional arithmetic seperti `position + 1` atau `position - 1` karena arithmetic tersebut merupakan implementasi primitive navigation.

`delimiterNavigation` memiliki stack arithmetic karena stack depth adalah state traversal delimiter.

Consumer tidak boleh mengulang arithmetic tersebut.

## `if` / `while` policy

`if` dan `while` tidak dihapus secara mekanis.

Yang dilarang adalah memakai control flow sebagai tempat menyimpan pengetahuan domain, misalnya:

```text
if method === X
if index === 0
if parameter === Y
switch bindingIndex
```

Pengetahuan tersebut dipindahkan menjadi:

```text
catalog
relation
ADT
syntax fact
presence
capability
```

Loop yang tersisa di `TokenCursor` dan `SyntaxRange` adalah traversal engine generik. Loop tersebut tidak menentukan makna Laravel.

## External architecture check

Tree-sitter memodelkan navigasi syntax melalui child/sibling/parent relations dan field names, sehingga consumer dapat mengakses struktur syntax berdasarkan relasi bernama, bukan posisi ordinal. Ini menjadi referensi arsitektural untuk RouteSync.

Laravel resource routing juga mendokumentasikan resource actions, nested/scoped resources, naming/parameters, dan middleware per resource action sebagai struktur route yang berbeda-beda; struktur tersebut lebih tepat direpresentasikan sebagai typed facts/relations daripada ordinal parser branches.

## Validasi

TypeScript `transpileModule` untuk seluruh `routeAst/*.ts`: **PASS**.

Full repository `tsc --noEmit` dan test runner belum dijadikan klaim PASS karena environment repository masih memiliki dependency/type-definition yang tidak tersedia.

## Target berikutnya

Audit berikutnya sebaiknya melanjutkan pada:

1. seluruh semantic method catalog agar pengetahuan Laravel tetap declarative;
2. presence/unresolved propagation agar unsupported expression tidak berubah menjadi empty datum;
3. group/resource nesting sebagai relation graph, bukan stack/index semantics di consumer;
4. provenance AST → Syntax Fact → Semantic Model tanpa fallback data-loss.
