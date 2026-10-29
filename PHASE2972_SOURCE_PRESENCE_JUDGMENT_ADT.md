# Phase2972 — Source Presence Judgment ADT

## Tujuan

Melanjutkan audit Fully Explicit Simplicity Typed Runtime Scanner Operations pada jalur pembentukan upstream → CLI → manifest. Perubahan ini memodelkan keberadaan sumber sebagai bukti domain bertipe, bukan boolean yang ditafsirkan berulang oleh source-selection ADT.

## Perubahan kode

### 1. Source presence menjadi ADT eksplisit

Di `packages/core/src/types/upstream/laravelRouteSourceSelection.ts`:

- `LaravelRouteSourcePresenceInterface.exists(sourceFile): boolean` diganti menjadi `observe(sourceFile): LaravelRouteSourcePresenceJudgment`.
- `LaravelRouteSourcePresenceJudgment` mempunyai dua varian: `laravel_route_source_present` dan `laravel_route_source_absent`.
- Kedua varian membawa operasi `continueWith(...)` dengan handler domain `onPresent` / `onAbsent`.
- Factory runtime diekspor dengan interface eksplisit: `laravelRouteSourcePresenceJudgmentFactory: LaravelRouteSourcePresenceJudgmentFactoryInterface`.
- Pemilihan sumber default memetakan bukti hadir ke sumber yang dipindai dan bukti absen ke observasi opsional, melalui operasi ADT.
- Pemilihan eksplisit memakai `SourceFileInventory.continueWith` untuk membedakan inventaris blocker dari inventaris kosong; pemeriksaan `missingFiles.kind === ...` dihapus.

Filesystem tetap merupakan batas infrastruktur: `fs.existsSync` menghasilkan fakta mentah yang segera dinormalisasi menjadi judgment hadir/absen. Kebijakan makna fakta tersebut berada di upstream ADT.

### 2. Jalur runtime upstream → CLI → manifest

Trace yang diaudit:

`packages/cli/src/upstreamCompositionFactory.ts`
→ `packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts`
→ `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts`
→ `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`
→ `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`
→ `packages/core/src/types/upstream/laravelRouteSourceSelection.ts`
→ read-batch / route AST / semantic flow / manifest.

Runtime exports pada entry files yang ditelusuri memakai kontrak eksplisit seperti `export const nama: Interface = Object.freeze({...})`. Tidak ada `export function` atau exported arrow factory tanpa interface eksplisit pada berkas trace langsung tersebut.

### 3. Relation foundation yang sudah dihapus

Tidak ada implementasi `relationMembership`, `relationalSequence`, atau `semanticRelations` yang dipulihkan. Dua stub di `packages/core/src/semantic/kernel/relationMembership.ts` dan `packages/core/src/semantic/kernel/relationalSequence.ts` dikosongkan agar tidak lagi mengekspor ulang modul yang sudah dihapus. `packages/core/src/types/upstream/collections.ts` tetap kosong.

## Audit

Jalankan:

```sh
node scripts/audits/audit-phase2972-source-presence-judgment-adt.cjs
```

Hasil pada workspace ini: **15/15 pemeriksaan struktural lulus**. Audit juga melakukan trace impor relatif dari entrypoint CLI/core/upstream dan melaporkan blocker transitive yang masih tersisa.

## Blocker repository yang belum selesai

- Ada **517 baris import lama pada 274 file** yang masih merujuk ke tiga relation foundation yang dihapus.
- Trace transitive dari entrypoint mengunjungi **1.237 file sumber**, dan **256 file reachable** masih mengimpor modul relation foundation yang hilang.
- Karena itu, build penuh belum berhasil diverifikasi dan belum boleh dinyatakan lulus. Build log yang diberikan sebelumnya menunjukkan 230 unresolved-import errors.
- Typecheck penuh dan unit test belum dijalankan: workspace tidak memiliki `node_modules`, dan TypeScript global yang tersedia tidak mendukung target `es2025` pada konfigurasi proyek. Pemeriksaan `transpileModule` untuk sintaks berkas yang diedit lulus, tetapi itu bukan pengganti typecheck.

Migrasi consumer harus dilanjutkan dengan memindahkan tiap tanggung jawab ke ADT/interface domain yang sudah tepat. Jangan membuat ulang fondasi generik dengan nama baru dan jangan mengalihkan semua consumer ke modul relasi generik lain hanya untuk menghilangkan error import.

## Referensi Laravel

Dokumentasi resmi Laravel menjelaskan bahwa route didefinisikan dalam file route di direktori `routes`, dan file yang dimuat ditentukan melalui konfigurasi aplikasi. Karena itu, RouteSync harus mempertahankan perbedaan antara default route source yang opsional dan file sumber yang dipilih eksplisit tetapi tidak tersedia. Rujukan: [Laravel Routing](https://laravel.com/framework/docs/routing).
