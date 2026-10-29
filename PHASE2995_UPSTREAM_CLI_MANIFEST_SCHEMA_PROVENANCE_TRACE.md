# Phase 2995 — Fully Explicit Typed Runtime Scanner Operations

## Tujuan
Audit jalur runtime upstream → CLI manifest dan mengidentifikasi kehilangan pengetahuan sebelum mengubah API publik. Tidak mengklaim provenance lengkap jika adapter produksi belum memindahkan datanya.

## Trace yang dibuktikan dari source

1. `packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts`
   - `resolveControllerActionContractImplementation` memanggil `context.schemaSemanticJudgment.forRouteRequest()`.
   - Hasil `.schema` diproyeksikan ke `ControllerActionContract.schema`; objek kontrak tetap menyimpan `schemaSemanticJudgment`.
2. `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`
   - `ControllerActionJudgmentPublication` membawa `semanticJudgment` kanonis dan source span.
3. `packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts`
   - `actionJudgmentForTarget` mengorelasikan controller/action dengan publication upstream.
   - Pada `routeBoundaryContractFromRouteFacts`, cabang `controller_reference` mengisi `schema: emptyRouteSchemaPayload()`.
   - Pemilihan action judgment disimpan terpisah sebagai `actionJudgmentSelection`; nilai schema dari publication tidak diproyeksikan ke `RouteBoundaryOptions`.
4. `packages/core/src/compiler/semantic/route-boundary/boundaryContractFactory.ts`
   - Factory mengubah options menjadi `RouteBoundaryContract` yang berisi identity, binding, capability, provenance, dan endpoint contract. Tidak ada field khusus untuk schema origin/source identity/inline validation evidence.
5. `packages/cli/src/generators/ManifestSerializer.ts`
   - Serializer mempertahankan `serialized.request.body.schema`; ini hanya membuktikan payload schema yang sudah mencapai endpoint contract, bukan provenance controller schema yang hilang sebelumnya.

## Kesimpulan

**Gap utama ditemukan:** route declaration target yang menjadi `controller_reference` mengisi schema kosong walaupun korelasi action judgment dilakukan di jalur yang sama. Karena schema action tidak diproyeksikan dari `actionJudgmentSelection`, belum ada bukti bahwa schema kanonis controller mencapai route boundary. Menambah field provenance ke serializer saja akan menutupi, bukan memperbaiki, kehilangan upstream ini.

## Rekomendasi implementasi berikutnya

1. Naikkan `ControllerActionJudgmentRouteSelection` menjadi hasil domain operasional: operasi route-request khusus harus mengembalikan hasil ADT eksplisit (`matched` dengan schema evidence lengkap atau outcome tertutup tanpa schema), bukan membuat konsumen membongkar selection dengan `switch`/`if`.
2. Buat satu adapter upstream yang memakai operasi itu sebelum `RouteBoundaryOptions` dibangun. Untuk matched action, bawa schema kanonis serta source identity, schema origin, dan validation entries; untuk unmatched/ambiguous/invalid, jangan diam-diam menyamarkannya sebagai schema kosong.
3. Evolusikan kontrak route boundary/endpoint hanya setelah pemilik semantik dan aturan serialisasi ditetapkan. Jangan menggandakan schema di beberapa field tanpa kontrak kepemilikan yang jelas.
4. Uji fixture Laravel yang menggabungkan Form Request dan `$request->validate(...)`; verifikasi action source span, schema fields, schema origin, inline validation entries, route contract, serialized manifest, dan IR.
5. Lanjutkan audit `export function` hanya pada runtime exports yang reachable. Gunakan `export const name: NameInterface = Object.freeze({...})`; jangan melakukan penggantian global mekanis.

## Status

- Trace source: selesai untuk titik-titik yang disebutkan.
- Schema payload controller → route boundary: **belum tertutup; ada jalur kosong eksplisit**.
- Provenance lengkap sampai serialized manifest/IR: **belum terbukti**.
- Full repository typecheck/test: **belum dijalankan pada phase ini**.
