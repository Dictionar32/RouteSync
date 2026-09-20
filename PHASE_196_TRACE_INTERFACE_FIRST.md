# Phase 196 — Interface-First Scanner Trace

## Tujuan
Memperbaiki interface upstream terlebih dahulu dan menggunakan compiler error sebagai flow untuk menemukan consumer yang belum tersambung.

## Trace
`ModelSymbolTable` sebelumnya mengekspos `OriginModelSymbol | undefined` untuk lookup model/table/resource.

Interface dinaikkan menjadi:

`Lookup<OriginModelSymbol>`

Lookup semantic sekarang menjadi SSOT untuk:
- model name lookup
- table name lookup
- resource convention lookup

`OriginModelSymbol` juga dinaikkan agar canonical model surface mengekspos:
- `column(name): Lookup<ModelSemanticColumn>`
- `relation(name): Lookup<ModelSemanticRelation>`

Consumer yang tersambung:
- `ResourceModelResolver`
- `twoPassRelationResolver`
- `propertyPathResolution`
- `structuralFieldMatcher`
- `collectionArrayBinders`

## Prinsip
Consumer tidak lagi menerima `undefined` sebagai semantic lookup contract.
ADTs dieliminasi melalui matcher terpusat (`matchLookup`) ketika consumer memang perlu memilih jalur found/missing.

## Error-driven flow
Full TypeScript compilation sebelumnya juga membuka syntax error lama pada:
- `resourceAstExpressionMapper.ts`
- `resourceUpstreamExpressionCanonical.ts`

Syntax tersebut diperbaiki terlebih dahulu agar scanner dapat diparse.

Setelah itu tidak ada lagi error TypeScript yang menyebut jalur:
`ModelSymbolTable`, `OriginModelSymbol`, `ResourceModelResolver`, `twoPassRelationResolver`, atau `structuralFieldMatcher`.

## Remaining blockers
Full workspace compile masih memiliki banyak error legacy/unrelated di area compiler lama, dependency (`axios`), dan semantic migration. Narrow config masih memiliki blocker `crypto`, tetapi narrow config tidak mencakup scanner.

Karena itu hasil ini **bukan klaim full project green**. Interface scanner/model lookup dinyatakan tersambung berdasarkan full-compile error filtering pada jalur tersebut.
