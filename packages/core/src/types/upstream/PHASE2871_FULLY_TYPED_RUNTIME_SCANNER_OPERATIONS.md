# Phase 2871 — Fully Typed Runtime Scanner Operations

## Tujuan

Audit ini menautkan tiga hal yang sebelumnya mudah tercampur: (1) jalur runtime pembentuk CLI manifest, (2) kontrak operasi yang sudah ada, dan (3) inventaris ekspor upstream yang belum memiliki anotasi tipe pada variabel ekspornya. Tidak ada klaim bahwa semua 278 deklarasi tanpa anotasi harus menjadi interface operasi: konstruktor nilai dan konstanta domain tidak sama dengan operasi runtime.

## Trace jalur pembentukan manifest

1. Pemanggil CLI menggunakan `controllerInvocationManifestBuilder.build(sourceProject, routeSelection)`.
2. `controllerInvocationManifestBuilder` di `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` memakai `ControllerInvocationManifestBuilderInterface`.
3. Builder membentuk `ControllerInvocationManifestCompositionInput`, kemudian menggunakan `routeSyncCliManifestScanOperationFactory.create(...).scan(input)`.
4. `routeSyncCliManifestScanOperationFactory` di `packages/cli/src/manifestScanOperationInterface.ts` memiliki anotasi `RouteSyncCliManifestScanOperationFactoryInterface`; `scan` mendelegasikan ke `ControllerInvocationManifestCompositionAuthorityInterface.compose`.
5. Composition menjalankan canonicalization identitas project. Hasil blocked dipertahankan sebagai `controller_invocation_manifest_source_project_identity_blocked`.
6. Discovery berjalan melalui `LaravelControllerSourceDiscoveryInterface`. Symlink, root/direktori hilang, dan error filesystem lain menghasilkan discovery blocked dengan bukti blocker dan partial source, bukan daftar kosong yang tampak sukses.
7. Dokumen dibaca melalui `PhpSourceDocumentReaderInterface` dan identitas dokumen diikat melalui kontrak binding. Rejection identitas dan blocked reads dipertahankan sebagai terminal yang berbeda.
8. Pipeline invocation menghasilkan bukti semantik; delivery dan `LaravelControllerInvocationSemanticJudgmentAuthorityInterface` membentuk judgment; inventory authority menutup inventory.
9. Inventory tervalidasi diteruskan ke `ManifestBuilderOperationPreparationInterface.prepare`; hasil `ManifestBuilderJudgment` mempertahankan complete atau blocked, termasuk bukti kegagalan AST/source model.
10. Factory terminal membungkus hasil tersebut dengan `continueForDriftAudit(handlers)`. Di batas konsumen, kelanjutan dipanggil pada nilai terminal, bukan dispatch `kind` yang ditulis ulang di tiap consumer.

## Kontrak yang harus digunakan ulang

- Scan CLI: `RouteSyncCliManifestScanOperationInterface`, `RouteSyncCliManifestScanOperationFactoryInterface`.
- Komposisi CLI: `ControllerInvocationManifestCompositionAuthorityInterface`, `ControllerInvocationManifestCompositionDependencies`, `ControllerInvocationManifestBuilderInterface`.
- Hasil terminal CLI: `ControllerInvocationManifest`, `ControllerInvocationManifestTerminalOperationInterface`, `ControllerInvocationManifestTerminalOperationsFactoryInterface`.
- Manifest builder: `ManifestBuilderInterface`, `ManifestBuilderJudgment`, handler `continueWith(...)` pada complete/blocked.
- Domain semantic dataflow: operasi bernama yang sudah dimigrasikan pada `semanticDataflowKnowledge.ts` Phase 2869.

Jangan membuat `GenericScanResult<T>`, `GenericContinuation<T>`, koleksi generik baru, atau interface helper yang hanya membungkus fungsi yang sama. `packages/core/src/types/upstream/collections.ts` wajib tetap kosong.

## Bentuk operasi runtime

Untuk operasi domain publik, bentuk yang diinginkan adalah object operation dengan kontrak bernama, bukan ekspor fungsi lepas atau arrow ekspor yang tipenya hanya diinferensikan:

```ts
export interface SourceDiscoveryOperationInterface {
  readonly discover: (input: LaravelControllerSourceDiscoveryInput) => Promise<LaravelControllerSourceDiscoveryResult>;
}

export const sourceDiscoveryOperation: SourceDiscoveryOperationInterface = Object.freeze({
  discover: (input: LaravelControllerSourceDiscoveryInput): Promise<LaravelControllerSourceDiscoveryResult> =>
    discoverControllerPhpFiles(input.sourceProject, input.root.value.value, input.root.value.value, Object.freeze([])),
});
```

Contoh ini menjelaskan bentuk kontrak; jangan menyalinnya sebagai perubahan mekanis karena repository sudah memiliki `LaravelControllerSourceDiscoveryInterface` dan implementasi `controllerSourceDiscovery`. Gunakan kontrak yang ada. Implementasi internal boleh berupa fungsi lokal, tetapi jangan mengekspor fungsi lepas sebagai API runtime.

## ADT operasional: data plus tindakan domain

`ManifestBuilderJudgment` sudah menjadi contoh penting: complete dan blocked memiliki `continueWith(handlers)`. `ControllerInvocationManifest` juga menambahkan `continueForDriftAudit(handlers)` pada setiap terminal. Ini lebih kuat daripada union yang hanya membawa `kind` dan payload.

Contoh penggunaan pada batas CLI (handler harus sesuai dengan signature lokal yang dideklarasikan):

```ts
const terminal: ControllerInvocationManifest = await controllerInvocationManifestBuilder.build(
  sourceProject,
  routeSelection,
);

const result = terminal.continueForDriftAudit(driftAuditHandlers);
```

Target evolusi upstream bukan menambah dispatch helper di atas union. Untuk setiap hasil yang memerlukan tindakan berbeda, authority yang menghasilkan hasil harus menyediakan operasi domain yang cukup, atau nilai ADT itu sendiri harus diberi continuation domain. Bila tindakan gagal harus menghentikan alur, kontrak handler menyatakan `never` pada terminal gagal, sehingga kegagalan tidak dapat disamarkan menjadi hasil sukses.

## Temuan kontrol alur yang masih tersisa

Composition masih membuat keputusan lokal di beberapa titik:

- filesystem discovery: pemeriksaan symbolic link, directory, nested discovery, dan `.php` file;
- `compose`: canonicalization blocked, discovery blocked, identity rejection, dan blocked reads.

Cabang filesystem adalah implementasi mekanisme OS dan mungkin tetap wajar berada pada adapter filesystem. Sebaliknya, keputusan domain pada hasil canonicalization/discovery/read harus ditinjau: apakah authority upstream sudah punya operasi lanjutan yang bisa digunakan langsung? Jangan memindahkan `if` yang sama ke helper lain dan menganggapnya sebagai penghapusan reasoning. Jangan menormalisasi AST failure menjadi empty AST/manifest.

## Hasil inventaris ekspor upstream

Skrip `scripts/audits/audit-phase2871-upstream-runtime-export-contracts.cjs` menggunakan TypeScript compiler API untuk menginventarisasi deklarasi ekspor pada `packages/core/src/types/upstream`, mengecualikan folder `__tests__`.

Hasil yang diukur pada workspace ini:

- 421 file TypeScript produksi.
- 0 `export function` declarations.
- 618 ekspor variabel; 340 memiliki anotasi tipe pada variabel ekspor.
- 278 ekspor variabel tanpa anotasi: 231 arrow initializer, 29 call initializer, dan 18 initializer lain.
- `collections.ts` = 0 byte.

Inventaris rinci ada di `PHASE2871_RUNTIME_EXPORT_INVENTORY.json`. Angka ini adalah daftar kandidat yang harus diklasifikasikan, bukan target otomatis untuk membuat 278 interface. Sebagian besar pekerjaan adalah memilah API operasi domain dari value constructor, vocabulary constants, dan helper yang seharusnya non-exported.

## Urutan migrasi yang disarankan

1. Prioritaskan ekspor yang berada pada jalur manifest: source discovery, source-document identity binding/read, invocation pipeline/judgment, inventory closure, manifest builder, dan AST judgments.
2. Untuk setiap kandidat, baca interface/ADT/authority yang sudah ada di `packages/core/src/types/upstream`; gunakan atau evolusikan kontrak itu terlebih dahulu.
3. Jika kandidat benar-benar operasi domain, ubah ekspor menjadi `export const operation: ExistingDomainOperationInterface = Object.freeze({...})`; migrasikan semua caller terkait.
4. Jika kandidat merupakan konstruktor nilai, pertahankan semantik konstruktor dan gunakan kontrak domain yang sudah ada bila memang tersedia. Jangan bungkus setiap fungsi menjadi interface secara seragam.
5. Tambahkan kelanjutan domain pada ADT di titik produksi hasil, lalu migrasikan konsumen. Hindari `switch`/`if` duplikatif di konsumen, generic dispatch helper, dan fallback yang menutupi kegagalan.
6. Setelah setiap batch kecil, jalankan typecheck package, test relevan, build, dan CLI manifest end-to-end dengan versi dependency yang didukung proyek.

## Sumber TypeScript terkait

- Interfaces dan kontrak fungsi: https://www.typescriptlang.org/docs/handbook/interfaces
- Discriminated unions dan narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Function types dan contextual typing: https://www.typescriptlang.org/docs/handbook/2/functions.html

Dokumentasi bahasa mendukung pengetikan kontrak struktural dan union ber-discriminator, tetapi tidak menentukan arsitektur domain repository. Keputusan tentang interface mana yang tepat harus berasal dari kontrak upstream yang sudah ada dan tanggung jawab domainnya.

## Batas verifikasi

Audit struktural Phase 2871 lulus 11/11 pemeriksaan. Audit ini bukan typecheck, build, atau test suite. Perubahan ini tidak mengklaim migrasi 278 ekspor sudah selesai; laporan mencatat pekerjaan tersisa secara eksplisit.
