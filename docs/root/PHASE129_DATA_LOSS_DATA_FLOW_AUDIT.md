# Phase 129 — Data-Loss / Data-Flow Audit

## Prinsip
Naikkan pengetahuan sintaks/semantik menjadi data model; jangan menyimpan pengetahuan Laravel sebagai control-flow fallback.

## Implementasi utama

### 1. Unsupported route target menjadi fact eksplisit
Sebelumnya target route yang tidak cocok dengan pola controller/action akan jatuh ke `closure` melalui fallback.

Sekarang model target memiliki tiga bentuk yang sudah dikenal dan satu bentuk preservation:

- `controller_action`
- `controller_invokable`
- `closure`
- `unsupported`

`unsupported` membawa `reason`, sehingga parser tidak lagi mengubah sintaks yang belum dikenali menjadi closure.

`RouteTargetAst` dan `RouteTargetDescription` keduanya mempertahankan fact tersebut sampai consumer.

### 2. Data-flow mempertahankan target unsupported
`RouteDataFlowFact<RouteTargetAst>` tidak melakukan normalisasi ulang. Node `route.target` membawa nilai AST apa adanya, sehingga `unsupported` tetap dapat diamati oleh semantic resolver/consumer.

### 3. Middleware semantic adapter
Target `unsupported` tidak diproyeksikan menjadi action palsu. Adapter menghasilkan `absent<ActionName>()`.

## Audit token/control-flow

Pada model utama:

- `??`: tidak ditemukan
- `null` literal: tidak ditemukan
- `Record`: tidak ditemukan
- `switch`: tidak ditemukan
- `indexOf` / `findIndex`: tidak ditemukan
- positional `[0]` / `[1]`: tidak ditemukan
- `+1/+2/+123` di luar primitive navigation: tidak ditemukan
- conditional ternary: tidak ditemukan pada model/data-flow yang diaudit

### Sisa yang disengaja
`if`/`while` hanya berada pada primitive traversal/execution layer seperti `TokenCursor` dan `SyntaxRange`. Positional arithmetic juga dibatasi pada primitive syntax navigation.

`===`/`!==` yang tersisa pada `routeSyntaxModel` adalah predicate struktural/catalog lookup. Ini menjadi kandidat berikutnya untuk dinaikkan lagi menjadi token/syntax predicate facts bila target audit mengharuskan penghapusan predicate operator dari model, bukan sekadar penghapusan control-flow branching.

`undefined` masih muncul pada boundary parser/AST lama (`RouteControllerAst | undefined`, `RouteDomainAst | undefined`) dan pada token-navigation boundary. Ini bukan lagi semantic data-flow representation karena `routeDataFlow` mengonversi group controller/domain ke `Presence`; penghapusan total `undefined` dari AST upstream akan menjadi migrasi kontrak lintas parser dan semantic adapters.

## External architecture alignment

Tree-sitter mendukung field names dan named nodes agar consumer mengakses relasi sintaks berdasarkan nama, bukan posisi. Static node types juga memodelkan required/multiple cardinality. Ini selaras dengan `SyntaxNavigation`, `SyntaxRange`, dan cardinality pada `RouteDataFlowEdge`. 

Laravel 13 mendokumentasikan bahwa nested route groups menggabungkan middleware dan `where` conditions, sementara prefix/name prefix digabungkan secara berbeda. Karena itu group facts dan constraints dipertahankan sebagai data append-only dengan provenance, bukan diputuskan oleh branch parser.

## Validation

Transpile TypeScript berhasil untuk file yang berubah:

- `routeDeclarationAst.ts`
- `routeSyntaxModel.ts`
- `routeMiddlewareAstAdapter.ts`
- `routeDataFlow.ts`
- `delimiterNavigation.ts`

Tidak ada klaim full-repository `tsc --noEmit` karena environment workspace tidak menyediakan seluruh dependency/type definitions.
