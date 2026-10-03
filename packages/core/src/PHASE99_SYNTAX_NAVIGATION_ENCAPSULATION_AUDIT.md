# Phase 99 — Syntax Navigation Encapsulation Audit

## Prinsip

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

Untuk syntax traversal, posisi token bukan pengetahuan domain. Karena itu positional arithmetic tidak boleh bocor ke parser. Arithmetic traversal menjadi implementation detail dari `TokenCursor`.

```text
PHP source
  ↓
Token stream
  ↓
TokenCursor                 ← satu-satunya pemilik posisi/arithmetic
  ↓
Typed Syntax Fact / RouteAst
  ↓
Semantic Knowledge Model
  ↓
Existing Interface
  ↓
Dumb Flow
```

## 1. Yang diperbaiki

`routeDeclarationParser.ts` sebelumnya memiliki:

- `tokens[i + 1]`, `tokens[i + 2]`, `tokens[i + N]`
- `i + N` sebagai parameter traversal
- `i - 1`
- `tokens.indexOf(end)`
- `i++`
- positional fallback melalui `Math.min(...)`

Seluruh pola tersebut dipindahkan ke `TokenCursor`.

Parser sekarang memakai relasi syntax:

```text
current
previous
next
afterNext
nextCursor
afterNextCursor
callOpen
callArgument
callArgumentCursor
secondCallArgument
secondCallArgumentCursor
classReference
find
until
untilCursor
isBefore
terminal
advance
```

`position + 1`, `position + 2`, dan akses array token hanya berada di implementasi privat `TokenCursor`.

## 2. Batas enkapsulasi

Diperbolehkan hanya di:

```text
TokenCursor
 └── private position
      ├── position - 1
      ├── position + 1
      ├── position + 2
      └── position + 1 untuk advance
```

Tidak diperbolehkan di parser:

```text
tokens[i + 1]
tokens[i + 2]
i + 3
i - 1
i++
tokens.indexOf(...)
tokens.slice(...)
```

Dengan demikian parser tidak mengetahui bagaimana posisi direpresentasikan.

## 3. Syntax traversal bukan semantic decision

`TokenCursor` tidak mengetahui Laravel.

Ia hanya mengetahui relasi syntax seperti:

```text
current → next → afterNext
current → callArgument
current → classReference
current → nextCursor
```

Sebaliknya, pengetahuan Laravel tetap berada pada semantic layer:

```text
Route
Binding
Resource
Middleware
Constraint
Capability
Relation
Presence
ADT
```

Contoh dokumentasi Laravel 13 menunjukkan bahwa route groups menggabungkan middleware dan `where` conditions, sementara prefix dan names digabungkan secara berbeda. Itu adalah semantic knowledge dan tidak boleh diturunkan dari posisi token di flow. citeturn0search0

Laravel 13 juga mendukung `RouteKey` untuk custom route model keys dan controller PHP attributes seperti `#[Middleware]` dan `#[Authorize]`; fitur seperti ini harus masuk sebagai semantic facts/ADT baru, bukan sebagai positional branches di parser downstream. citeturn0search0turn0search1

Laravel 13 kini juga memiliki structured route metadata yang dapat diwariskan/merge dari group ke child route. Ini merupakan Relation/Metadata knowledge baru, bukan alasan untuk menambah pemeriksaan posisi token. citeturn0search2

## 4. Data-loss audit

Audit production lexer + semantic scanner:

```text
??                         0
|| fallback                0
filter(Boolean)            0
findIndex                  0
.at(...)                   0
raw token positional math  0 outside TokenCursor
raw token indexing         0 outside TokenCursor
semantic i + N             0
semantic index + N         0
semantic undefined/null comparisons 0
production any             0
semantic ternary           0
```

`if`, `while`, dan `for` yang tersisa pada lexer adalah structural syntax navigation/state handling, bukan keputusan Laravel semantic. Parser tidak lagi mengendalikan traversal melalui positional arithmetic.

## 5. Data-loss invariant

Tetap berlaku:

```text
absent      != empty
unknown     != fabricated
unsupported != dropped
expression  != string yang dipaksakan
identity    != array position
```

Semantic absence memakai `Presence`/ADT. Syntax cursor tidak mengubah missing token menjadi semantic datum.

## 6. Validasi

Static scan berhasil menunjukkan tidak ada raw token traversal arithmetic di luar `TokenCursor`.

Targeted TypeScript check tetap mencapai boundary baseline archive karena archive Phase 98 tidak membawa `phpAstTypes` dan beberapa source dependency parser. Error tersebut berasal dari file yang memang sudah hilang dari archive, bukan dari pesan type error baru yang terdeteksi pada perubahan Phase 99.

Percobaan transpile tambahan menggunakan `esbuild` tidak selesai dalam batas waktu environment, sehingga tidak dijadikan bukti validasi.

## 7. Kesimpulan arsitektur

Sebelum:

```text
Parser
 └── tahu array + posisi
      └── i + N
```

Sesudah:

```text
Parser
 └── tahu syntax relation
      └── TokenCursor
           └── tahu posisi sebagai implementation detail
```

Jadi traversal arithmetic sekarang benar-benar dienkapsulasi sebagai **Syntax Navigation Model**, sementara Laravel knowledge tetap dinaikkan ke semantic model.
