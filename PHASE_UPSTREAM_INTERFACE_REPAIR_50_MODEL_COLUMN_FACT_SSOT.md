# Phase Upstream Interface Repair 50 — Model Column Fact SSOT

## Scope
Seluruh `packages/core/src` aktif, dengan `packages/core/src/compiler.ts` legacy dikecualikan.

## Trace
Root sebelumnya menemukan `modelColumnFactsCanonical.ts` sudah menerima `ModelColumnCandidate`, tetapi `ModelColumnCandidate` merupakan duplikasi struktural `ModelColumnFact`. Producer masih membentuk candidate lalu canonical builder membangun ulang fact yang sama.

## Perbaikan
1. Menghapus duplicate `ModelColumnCandidate` dari `types/upstream/modelSourceFacts.ts`.
2. `correlateModelColumnFacts()` sekarang menghasilkan canonical `ModelColumnFact` langsung.
3. `modelColumnFactsCanonical.ts` tidak lagi melakukan semantic reconstruction; ia hanya meneruskan canonical facts.
4. `modelParser.ts` menggunakan `correlateModelColumnFacts()` sebagai origin boundary.
5. Tidak membuat vocabulary cast/column kedua.

## Dataflow baru
```text
migration ParsedColumn + model ParsedCast
        ↓
modelColumnOrigin
        ↓
ModelColumnFact (SSOT)
        ↓
modelColumnFactsCanonical (identity boundary)
        ↓
ModelAst / ModelSchema / downstream
```

## Catatan penting
Korelasi `column ↔ cast` masih terjadi di origin boundary karena kedua fakta berasal dari dua sumber Laravel yang berbeda. Ini bukan re-classification downstream. Namun `ParsedColumn` dan `ParsedCast` masih merupakan legacy source vocabulary dan akan menjadi target trace producer berikutnya.

## Verifikasi
- `ModelColumnCandidate` tidak lagi direferensikan di `packages/core/src`.
- Tidak ada perubahan pada `packages/core/src/compiler.ts` legacy.
- Full TypeScript compile belum dapat dijalankan dari workspace ini karena tidak terdapat root `tsconfig.json`; narrow configs yang tersedia adalah `tsconfig.phase87.33*.json`.
