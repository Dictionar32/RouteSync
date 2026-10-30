# Rancangan Implementasi Scanner Laravel Langsung di Upstream

Status: implementasi parsial. Lexer/parser mandiri telah dihapus; operasi scanner menerima `RouteDeclarationEvidence` sebagai input domain dan menjalankan source-selection ADT secara langsung. Produksi evidence dari source serta wiring scan end-to-end CLI masih belum tersedia.

## Tujuan

Menyediakan scanner Laravel yang membaca source project dan menghasilkan manifest yang seluruh fakta route, controller, request, model, resource, response, middleware, migration, dan provenance-nya dapat ditelusuri ke source. Jalur produksi yang dituju:

```text
CLI scan/sync
  -> komposisi CLI bertipe
  -> ManifestBuilderOperationPreparationInterface.prepare(input)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> scanner/authority upstream yang sudah diberi input dan dependency eksplisit
  -> CompleteSourceAst atau blocker bertipe
  -> source model dan manifest upstream
  -> proyeksi/validasi/persistensi CLI
```

Implementasi runtime publik menggunakan object operation berkontrak, misalnya `export const laravelRouteScanner: LaravelRouteScannerInterface = Object.freeze({ ... })`. Tidak menambahkan lapisan `compiler`, `relation`, atau `foundation`; juga tidak membentuk manifest sukses dari kategori source kosong atau belum dipindai.

## Trace kondisi repository saat rancangan dibuat

- `LaravelSourceAstPipelineInterface` dan `LaravelSourceAstPipelineDependenciesInterface` sudah mendefinisikan kontrak eksekusi dan dependency closure di `packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts`.
- `ManifestBuilderInterface` serta `ManifestBuilderOperationPreparationInterface` sudah ada di `manifestBuilderInterface.ts`.
- `LaravelRouteScannerInterface` sudah menetapkan input scan, dependency authority, operasi yang disiapkan, artifact route, dan terminal blocked/complete di `laravelRouteScannerInterface.ts`.
- Parser aktif `packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts` menginventarisasi bukti invocation PHP. Ia bukan implementasi route scanner atau pipeline source-AST.
- `LaravelRouteScannerInterface` menerima deklarasi sebagai `RouteDeclarationEvidence`; scanner tidak memiliki lexer/parser dan tidak mengklasifikasikan ulang source. Pembentukan evidence harus dilakukan oleh operasi domain upstream yang memiliki provenance source, lalu diberikan sebagai data saat CLI memanggil operasi scanner.
- Tidak ditemukan implementasi/factory aktif untuk `LaravelSourceAstPipelineInterface` dan banyak kontrak scanner di bawah `types/upstream`. `manifestBuilderOperationPreparation.prepare()` saat ini berhenti dengan error eksplisit.
- CLI bootstrap masih meminta host module `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE`; semantik request derivation pun belum memiliki komposisi produksi bawaan yang terverifikasi.
- Satu dependency closure perlu ditinjau sebelum pipeline dibangun: runtime pipeline terdahulu memanggil `ChannelScanner` secara langsung, tetapi `LaravelSourceAstPipelineDependenciesInterface` tidak memuat scanner channel. Jangan menyembunyikan dependency itu di dalam executor. Jika channel termasuk `CompleteSourceAst`, masukkan kontrak/dependency yang tepat ke closure yang sudah ada, atau ubah aturan kelengkapan secara eksplisit dan berbukti.

## Kontrak yang digunakan

Implementasi harus mengisi kontrak yang sudah dimiliki domain, bukan membuat keluarga interface duplikat:

| Tanggung jawab | Kontrak yang dipakai |
| --- | --- |
| Persiapan dan eksekusi manifest | `ManifestBuilderOperationPreparationInterface`, `ManifestBuilderInterface`, `ManifestBuilderJudgment` |
| Akuisisi dan proyeksi seluruh kategori AST | `LaravelSourceAstPipelineInterface`, `LaravelSourceAstPipelineDependenciesInterface`, `LaravelSourceAstProjectionJudgment` |
| Pemilihan route source | `LaravelRouteSourceSelectionIntent` dan authority/observation yang sudah ada |
| Route scan dan komposisi deklarasi | `LaravelRouteScannerInterface`, `RouteDeclarationEvidence`, `LaravelRouteDeclarationCompositionAuthorityInterface` |
| Penjagaan kelengkapan source | `CompleteSourceAst`, `validateCompleteSourceAst`, serta blocker milik kategori yang gagal |
| CLI manifest terminal | `RouteSyncCliManifestScanOperationInterface` dan terminal invocation-manifest yang sudah ada |

Private helper boleh memecah implementasi, tetapi setiap entry operation publik tetap bertipe interface upstream. Helper tidak boleh menjadi kontrak semantik paralel.

## Tahapan implementasi

### 1. Tetapkan composition root dan dependency closure

1. Buat implementasi `laravelSourceAstPipelineFactory` yang menerima pasangan `dependencies` dan `LaravelSourceAstPipelineExecutionInput` secara eksplisit dan menghasilkan operasi `LaravelSourceAstPipelineInterface`.
2. Implementasikan `manifestBuilderOperationPreparation` sebagai adapter yang menutup dependency pipeline/source-model/surface yang tetap; `prepare(input)` harus mengembalikan object `ManifestBuilderInterface`, bukan melempar karena jalur belum disusun.
3. Komposisi CLI merakit operation upstream yang sama satu kali dan menginjeksikannya ke `ControllerInvocationManifestCompositionDependencies`.
4. Setelah komposisi bawaan lengkap dan tervalidasi, bootstrap tidak lagi mewajibkan host environment module untuk kemampuan yang memang disediakan RouteSync. Kalau capability request derivation masih eksternal, pertahankan requirement tersebut secara jelas sampai implementasinya benar-benar tersedia; jangan menggantinya dengan authority dummy.
5. Audit semua dependency terhadap interface closure. Tidak boleh ada import hidden ke parser/operasi lain di dalam pipeline bila dependency yang sama tidak tercatat pada input/dependencies.

### 2. Implementasikan source acquisition dan parser boundary milik RouteSync

- Pakai `PhpSourceDocumentReaderInterface` dan identity binding yang aktif. Setiap dokumen tetap memiliki `SourceFile`, isi, dan span/offset sumber yang sama sejak baca hingga AST/provenance.
- Buat lexer TypeScript milik RouteSync yang menghasilkan token ber-offset dan berlokasi. Lexer memahami komentar, PHP open/close tag, string ber-quote/escape, identifier/nama qualified, angka, whitespace, punctuation, dan delimiter bertingkat. Jangan memecah source memakai regex karena delimiter/teks yang tampak seperti `Route::` dapat berada di komentar atau string.
- Di atas token tersebut, buat parser kecil untuk grammar route Laravel yang memang didukung. Ini bukan parser semua PHP: parser mengenali statement route, ekspresi literal/array/controller target, chain modifier yang dikenal, dan callback `group` yang berisi statement route.
- Parser hanya menghasilkan `RouteDeclarationEvidence` dan blocker syntax yang mempertahankan rentang source. Semantik Laravel seperti group inheritance, middleware, controller binding, dan generated resource routes tetap milik operasi upstream.
- Konstruksi PHP dinamis yang belum ditangani—misalnya variabel sebagai target/path, conditional registration, helper/macro route tak dikenal, computed array, expression yang belum dipahami—berakhir sebagai blocker `unsupported`, bukan ditebak atau diabaikan.
- Parsing gagal menjadi blocker diagnostik yang menyimpan file dan lokasi; jangan mengembalikan AST kosong sebagai keberhasilan.
- Scanner menerima inventory file yang deterministik. File yang eksplisit diminta tetapi hilang harus mengikuti blocker selection yang sudah ada.

### 3. Implementasikan route scanner lebih dahulu sebagai slice vertikal

Implementasikan `LaravelRouteScannerInterface` dengan dependency yang sudah tercantum pada kontrak:

1. `prepare(input)` mengikat controller scan dan route selection intent ke satu `LaravelRouteScanOperationInterface`.
2. Resolve inventory route source melalui `declarationCompositionAuthority.resolveSourceFiles(...)`; catat observasi tiap file.
3. Baca file melalui `sourceDocumentReader`; hasil partial/read failure dipertahankan dalam terminal source-read blocker.
4. Lexer source menjadi token beridentitas dan offset; parser route membaca token stream dan membentuk `RouteDeclarationEvidence` untuk setiap deklarasi yang didukung. Bukti minimal menyertakan metode, path, target, source/end token, span, group prefix/name/controller/domain, middleware, constraints, bindings, dan modifier resource yang benar-benar ditemukan.
5. Turunkan konteks group secara bertumpuk: prefix/name digabung sesuai aturan Laravel; middleware dan constraint diwariskan; atribut route individual menambah/mengubah konteks menurut aturan framework. Keluar dari group mengembalikan konteks sebelumnya.
6. Operasikan deklarasi melalui `declarationMethodAuthority`, `declarationCompositionAuthority.compose`, path/resource-flow/correlation/policy/authorization authorities, `routeProducerInputComposition`, dan `routeProducer`. Scanner tidak membuat ulang kebijakan tersebut dengan klasifikasi string lokal.
7. Lampirkan hasil sebagai `LaravelRouteScanArtifact` yang menyatukan route AST, semantic flow, binding, dan authorization judgment.
8. Jika target/action tidak dapat dikorelasikan, policy/response belum terverifikasi, atau sintaks berada di luar coverage, keluarkan blocker domain yang sudah tersedia; jangan mengarang controller/action/response.

Resource routes perlu diekspansi sebagai aturan Laravel yang eksplisit dan teruji, termasuk `only`/`except`, `apiResource`, singleton, shallow/scoped, parameter override, middleware per action, serta `missing`/`withTrashed` bila disokong kontrak. Bila belum disokong, nyatakan blocker/unsupported evidence; jangan diam-diam menganggapnya sebagai route standar.

### Bentuk kode scanner

Berikut bentuk implementasi yang dituju untuk route scanner. Ini adalah sketsa kode arsitektural, **bukan file runtime yang bisa langsung dikompilasi**: komposisi authorities/parser di bagian `TODO` belum tersedia pada snapshot ini. Nama interface dan input/output mengacu pada kontrak yang sudah ada; tidak membuat interface scanner paralel.

```ts
// packages/core/src/types/upstream/laravelRouteScanner.ts
import type {
  LaravelRouteScannerInterface,
  LaravelRouteScanOperationInterface,
  LaravelRouteScanInput,
} from './laravelRouteScannerInterface';

export const laravelRouteScanner: LaravelRouteScannerInterface = Object.freeze({
  kind: 'laravel_route_scanner',
  closed: true,
  contractVersion: 39,

  // Seluruh capability disimpan pada komposisi upstream, bukan dibuat per scan.
  ...laravelRouteScannerAuthorities,

  prepare: async (
    input: LaravelRouteScanInput,
  ): Promise<LaravelRouteScanOperationInterface> => {
    const controllerScan = input.controllerScan;
    const sourceProject = controllerScan.sourceProject;
    const selectedFiles = laravelRouteScannerAuthorities
      .declarationCompositionAuthority
      .resolveSourceFiles(sourceProject, input.sourceSelectionIntent);

    const outcome = await observeAndScanSelectedRouteSources({
      input,
      selectedFiles,
      authorities: laravelRouteScannerAuthorities,
    });

    return Object.freeze({
      kind: 'prepared_laravel_route_scan_operation',
      closed: true,
      contractVersion: 4,
      ...laravelRouteScannerAuthorities,
      input,
      execute: async () => outcome,
    });
  },
});
```

`observeAndScanSelectedRouteSources` di atas adalah helper privat implementasi; ia bukan exported function atau interface kedua. Operasi tersebut mesti berjalan berurutan seperti berikut:

```ts
// Pseudocode: pemetaan node parser ke RouteDeclarationEvidence adalah parser syntax-only.
const readBatch = await selectedObservation.continueToRouteScan(sourceDocumentReader);

return readBatch.continueWith({
  onBlocked: blocked => routeScanOutcomeOperations.sourceReadBlocked(blocked),
  onComplete: async complete => {
    const evidence = complete.documents.flatMap(document =>
      parseLaravelRouteDeclarations(document),
    );

    const artifacts = evidence.flatMap(declaration => {
      const method = declarationMethodAuthority.judge({
        method: declaration.method,
        targetMethods: declaration.targetMethods,
      });
      const boundaries = declarationCompositionAuthority.compose({
        declarationEvidence: declaration,
        methodJudgment: method,
        authorizationAuthority,
        routeResourceFlowAuthority,
        routePathResolutionAuthority,
        sourceFile: declaration.span.sourceFile,
        controllerScan,
        publications: controllerActionPublications(controllerScan),
        controllerActionRouteCorrelationAuthority,
      });

      return boundaries.map(boundary => {
        const ast = routeProducer.produce(
          routeProducerInputComposition.compose({
            boundary,
            declaration,
            source: declaration.span,
            methodJudgment: method,
          }),
        );
        const binding = bindingAuthority.judge({
          kind: 'route_controller_binding_judgment_input',
          route: ast,
          controllerActions: controllerActions(controllerScan),
        });
        return routeArtifactOperations.correlate({
          ast,
          boundary,
          binding,
          declaration,
        });
      });
    });

    return declarationCompositionAuthority.outcomeFromScan(
      routeScanJudgmentOperations.complete({
        sourceFiles: complete.sourceFiles,
        artifacts: artifacts.flat(),
      }),
    );
  },
});
```

Pseudo-code itu sengaja memperlihatkan ownership: parser menghasilkan bukti sintaks; method authority, composition authority, route producer, binding authority, dan outcome operation menghasilkan semantik/ADT domain. Implementasi final harus memakai nama dan bentuk API persis yang tersedia pada kontrak; contoh di atas bukan izin untuk menambah `routeArtifactOperations` bila kontrak tersebut belum ada.

Untuk pipeline, bentuk public operation tetap kontrak `LaravelSourceAstPipelineInterface`; builder menutup operation tersebut dengan input yang sama:

```ts
export const manifestBuilderOperationPreparation:
  ManifestBuilderOperationPreparationInterface = Object.freeze({
    kind: 'manifest_builder_operation_preparation',
    contractVersion: 1,
    prepare: (input: ManifestBuilderInput): ManifestBuilderInterface => {
      const sourceAstPipeline = laravelSourceAstPipelineFactory.create(
        sourceAstDependencies,
        Object.freeze({
          kind: 'laravel_source_ast_pipeline_execution_input',
          invocationInventoryReceipt: input.invocationInventoryReceipt,
          routeSelection: input.routeSelection,
        }),
      );
      return manifestBuilderFactory.create({ input, sourceAstPipeline });
    },
  });
```

`laravelSourceAstPipelineFactory` dan `manifestBuilderFactory` pada sketsa tersebut adalah nama composition operation yang perlu benar-benar diimplementasikan terhadap interface yang ada; keduanya belum tersedia sebagai runtime export aktif. Dependency `sourceAstDependencies` wajib menjadi satu closure eksplisit dan tidak boleh diam-diam mengambil `ChannelScanner`, parser, atau source reader dari module global.

### 4. Jalankan kategori AST menurut dependency, bukan satu lompatan

Pipeline mengakuisisi migration/schema lebih dahulu bila dibutuhkan model; lalu model dan FormRequest; semantic PHP evidence/query; DTO inventory; controller scan; route scan; resource binding; response; service/middleware/provider/attribute/channel. Urutan aktual ditentukan dependency kontrak, bukan urutan kosmetik.

Setiap tahap:

- menerima source project dan hasil tahap sebelumnya yang bertipe;
- menghasilkan artifacts yang menyatukan source evidence dengan AST/definition;
- memiliki terminal blocked sendiri dan mempertahankan partial products yang sah;
- mencegah tahap turunan berjalan jika inventory prerequisite incomplete;
- tidak mengubah kategori `not_scanned`/`incomplete` menjadi `scanned: []`.

### 5. Bentuk dan publikasikan manifest

`LaravelSourceAstProjectionJudgment` complete hanya dapat diterbitkan sesudah `validateCompleteSourceAst` menerima semua kategori wajib. Builder lalu menjalankan `CompleteLaravelSourceModelBuilderInterface`, `SemanticDataflowManifestSurfaceInterface`, dan `ResourceGroupCapabilityAlgebraInterface` sesuai kontraknya untuk menghasilkan `ManifestBuilderJudgment` complete atau blocker.

RequestType-to-RouteManifest projection adalah gate terpisah setelah `RouteSyncManifest` lengkap. Perbaiki `routeManifestRequestResolutionPreflight` dan `routeManifestProjectionCompositionFactory` hanya ketika authority/evidence derivation yang diminta telah terkomposisi. Saat ini kedua operasi itu fail-closed; jangan menyamarkan keberhasilan source scan sebagai keberhasilan projection akhir.

## Cakupan uji implementasi

Setiap tahap perlu unit tests untuk operasi dan terminalnya; integration test berikutnya menggunakan fixture source dan kemudian folder `toko-online`:

1. Parse semua `routes/api.php`, `routes/web.php`, dan file route yang didaftarkan melalui `bootstrap/app.php`.
2. Route API eksplisit: `Route::get/post/put/patch/delete`, `Route::match`, controller class-action array, route parameter `{id}`/`{provider}`, dan group `auth:sanctum` serta `admin`.
3. Route web closure `/` harus tetap dibedakan dari controller action dan response-nya hanya lengkap bila response semantic authority dapat membuktikannya.
4. Verifikasi prefix `/api` sebagai route-registration context Laravel tanpa menggandakannya dengan CLI `baseURL` (`http://localhost/api`). Prefix framework dan URL output adalah dua sumber/operasi berbeda.
5. Route file hilang, parse failure, target controller hilang, method/action tidak ada, middleware alias belum terdefinisi, resource yang tidak didukung, dan binding ambiguity menghasilkan blocker yang tepat.
6. Assert semua output route dapat ditelusuri ke span/file sumber dan tidak ada AST kategori kosong yang diperlakukan lengkap.

Sampai coverage route dan kategori source yang wajib lengkap, `scan toko-online` hanya boleh melaporkan hasil parsial/blocked dengan provenance; jangan membuat manifest complete.

## Kriteria selesai

- Runtime exports memakai `export const nama: ExistingInterface = Object.freeze({ ... })` pada entry operation publik.
- Tidak ada import/require dari folder `compiler`, `relation`, atau `foundation` pada jalur scanner.
- Semua dependencies scanner tercantum dalam closure yang dimiliki kontrak upstream; tidak ada `ChannelScanner` atau parser tersembunyi.
- Source selection/read/parser/scanner failures mempertahankan blocker dan provenance yang tepat.
- `npm run build` dan typecheck lulus; integration scan fixture dan `toko-online` menghasilkan manifest yang dapat ditelusuri atau blocker eksplisit.
- Keberhasilan CLI bukan sekadar berhasil parse PHP: pipeline, source-model, semantic projection, manifest validation, dan persistensi yang diwajibkan juga harus lulus.

## Referensi

- [Laravel 12 Routing](https://laravel.com/docs/12.x/routing) — route registration, group, middleware, model binding, dan route resource.
- [Laravel 12 Controllers](https://laravel.com/docs/12.x/controllers) — resource route, nesting, dan middleware per resource action.
- [PHP `token_get_all`](https://www.php.net/manual/en/function.token-get-all.php) — referensi perilaku lexical token PHP; rancangan ini memilih lexer TypeScript milik RouteSync, bukan dependency parser tersebut.
- [PHP namespace imports](https://www.php.net/manual/en/language.namespaces.importing.php) dan [anonymous functions](https://www.php.net/manual/en/functions.anonymous.php) — konstruksi PHP yang perlu dipertimbangkan lexer/parser saat membaca alias controller dan callback group.
- [Laravel route registration API](https://api.laravel.com/docs/12.x/Illuminate/Routing/Router.html) — surface API router Laravel.
