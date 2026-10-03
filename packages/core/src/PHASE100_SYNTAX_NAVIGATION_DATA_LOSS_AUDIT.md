# RouteSync — Phase 100 Syntax Navigation & Data-Loss Audit

## Prinsip

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

Untuk syntax traversal, posisi token bukan pengetahuan domain. Karena itu positional arithmetic menjadi implementation detail milik `TokenCursor`.

## Boundary

```text
PHP source
  ↓
token stream
  ↓
TokenCursor                 ← satu-satunya pemilik positional arithmetic
  ↓
Typed Syntax Fact / RouteAst
  ↓
Semantic Knowledge Model
  ↓
Existing Interface
  ↓
Dumb Flow
```

## Encapsulation invariant

Di luar `tokenCursor.ts` tidak boleh ada:

- `tokens[i + N]`
- `tokens[i - N]`
- `i + N` / `i - N` untuk navigasi token
- `i++` / `++i` untuk navigasi token
- `tokens.indexOf(...)`
- direct token-array positional access

`TokenCursor` boleh menyimpan `position + N` karena posisi adalah private implementation detail dari model navigation.

## Navigation knowledge

Parser menggunakan relasi bernama:

```text
current
previous
next
afterNext
nextCursor
afterNextCursor
callOpen
callArgument
firstCallArgument
callArgumentCursor
secondCallArgument
secondCallArgumentCursor
classReference
find
until
untilCursor
advance
isBefore
```

Dengan demikian parser tidak mengetahui angka offset token.

## Data-loss audit

```text
??                         0
|| fallback                0
filter(Boolean)            0
findIndex                  0
.at(...)                   0
raw token arithmetic       0 outside TokenCursor
raw token array access     0 outside TokenCursor
semantic numeric index     0
semantic ternary           0
semantic if/switch         0
production `any`            0
```

`undefined` yang masih muncul pada tipe AST merupakan optionality syntax. Pada boundary AST → semantic fact, optionality dikonversi ke `Presence`.

## Control-flow classification

### Allowed: syntax structure

`if`, `while`, `continue`, dan state traversal tetap boleh berada pada lexer/parser ketika fungsinya adalah:

- mengenali token;
- menemukan delimiter;
- menjaga nesting/depth;
- membentuk AST/syntax fact.

Menghapus control flow tersebut tanpa model syntax yang setara justru menyamarkan grammar.

### Forbidden: semantic Laravel decisions in flow

Semantic layer tidak boleh menentukan makna Laravel melalui:

```text
index
array position
fallback
undefined/null sentinel
boolean combination
```

Makna Laravel harus dinaikkan menjadi:

```text
Identity
Entity
Relation
Capability
Constraint
Presence
Provenance
ADT
Catalog
```

## Laravel grounding

Laravel 13 mendokumentasikan route groups sebagai kumpulan atribut yang digabungkan/diwariskan, resource controllers sebagai himpunan action/capability, dan middleware resource sebagai scope terhadap action. Ini adalah semantic concepts dan tetap berada di upstream semantic model, bukan di token navigation.

Laravel 13 juga menambah route metadata sebagai data terstruktur yang diwariskan/merged pada group dan child routes. Fitur seperti ini harus ditambahkan sebagai semantic datum/relation, bukan sebagai parser index atau downstream conditional.

## Kesimpulan

Traversal arithmetic sekarang benar-benar memiliki satu rumah: `TokenCursor`.

Parser hanya meminta relasi syntax. Semantic resolver hanya menerima typed facts dan mengubahnya menjadi semantic ADT. Flow tidak perlu mengetahui posisi token maupun cara Laravel diekspresikan secara lexical.
