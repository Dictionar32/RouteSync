# Phase 38 — Whole Core Interface Audit

Scope: `packages/core/src` seluruh folder, bukan hanya `types/upstream`.

## Trace

Core berisi 996 TypeScript files. Audit menemukan pola runtime/lookup/absence di banyak lapisan. Pola tersebut tidak boleh dihapus massal karena sebagian adalah algoritmik (lexer/parser/cache/runtime), sedangkan sebagian lain adalah semantic re-classification akibat interface terlalu rendah.

## Prioritas semantic interface

1. `types/domain/models.ts` — `ModelSemanticPropertyIndex.get(): T | undefined` dinaikkan menjadi `lookup(): Lookup<T>`.
2. `types/domain/resourceModelSurface.ts` — consumer internal dipindahkan ke `Lookup`, sehingga property/relation resolution memakai semantic result.
3. `types/domain/provenance/endpointProvenance.ts` — `controller/request/response: T | null` dinaikkan menjadi `Option<T>`.
4. `types/domain/contracts.ts` — provenance producer diperbaiki untuk mengisi `Option.none`, bukan `null`.

## Bukan target langsung

- `client/*`: runtime HTTP boundary, bukan compiler upstream semantic model.
- `compiler/cache/*`, queue, memoization: absence cache dapat legitimate.
- `compiler/scanner/lexer/*`: parser rejection/partial token classification dapat legitimate dan perlu ADT tersendiri, bukan dipaksa menjadi semantic success.
- `compiler/analysis/*`: dataflow algorithms dapat legitimate memiliki missing state.

## Next semantic roots

- `types/domain/semanticCollections.ts`: banyak `get(): T | undefined` masih menjadi kandidat interface collection ADT.
- `semantic/SymbolTable.ts`: model/column/accessor/relation/cast lookup masih primitive optional dan harus ditelusuri apakah lookup itu source semantic atau internal symbol-table algorithm.
- `compiler/scanner/subscanners/controller/controllerDataflowContract.ts`: semantic inference masih terlalu rendah dan perlu dinaikkan ke controller dataflow facts.
- `types/domain/resourceModelMethodResolver*`: banyak `| undefined` yang harus diklasifikasikan apakah parser rejection atau semantic incompleteness.
- `types/domain/resourceGroupDescriptors.ts`: `null` route branches perlu diganti closed route-state ADT jika memang merepresentasikan CRUD absence.

## Verification

Tidak dilakukan cleanup massal terhadap seluruh 1,974 pattern. Angka tersebut adalah sinyal audit, bukan target penghapusan. Setiap root harus trace producer → interface → consumer terlebih dahulu.
