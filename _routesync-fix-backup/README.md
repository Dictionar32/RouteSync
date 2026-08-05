# RouteSync — Bug Fix Backup

Backup dari sesi debugging panjang, mulai dari `generate-v2` (Contract IR
Architecture) sampai ke `LaravelRouteParser.ts` (parser manifest) dan
`incremental.ts` (caching). Dimulai dari target "match 29 interface
ground-truth dari `zodtiergenerator` (engine lama)", berkembang jadi
perbaikan arsitektur yang lebih dalam setelah ketemu root cause asli:
parser manifest kehilangan linkage Route→Resource.

**Status akhir: 7 file source diperbaiki, 19 root-cause bug/fase, semuanya
diverifikasi lewat eksekusi nyata terhadap project Laravel produksi
`toko-online` (bukan cuma sample `ecommerce_shop-main`), 0 regresi di
sepanjang jalan.**

Filosofi output berubah di tengah jalan: bukan lagi "match 29 nama
ground-truth apa adanya", tapi **"generate hanya shape yang genuinely
muncul di response API"** — model DB murni yang ga pernah jadi response
endpoint manapun sengaja TIDAK digenerate. Lihat
`ISSUE-manifest-resource-linkage.md` untuk penjelasan lengkap kenapa
keputusan ini diambil, dan proposal arsitektur `ResponseDescriptor` yang
jadi arah pengembangan setelahnya (sekarang sudah diimplementasi penuh,
lihat bug #14-17 di bawah).

## File yang diubah (7 total)

| File | Layer | Ringkasan |
|---|---|---|
| `01-resource-naming.ts` | ReadEmitter | Stop strip suffix `Resource` |
| `03-ReadEmitter.ts` | ReadEmitter | Tambah case `datetime` yang kelewat |
| `04-manifest-enricher.ts` | ReadEmitter | Dedupe, GET-fallback naming, idempotent enrich, skip infer model utk resource non-DB |
| `ContractGenerator.ts` | ReadEmitter | `manifest.models` dibaca (filter reachability), fix resolusi `resource`/`model` kind, baca `transport`/`shape` (Fase 2 ResponseDescriptor) |
| `ContractIRBuilder.ts` | ReadEmitter | Fix nested resource reference (`items: unknown` → `OrderDetailResourceTransformed[]`) |
| `incremental.ts` | Scan caching | Fix stale-cache bug — hash sekarang ikut model availability |
| `LaravelRouteParser.ts` | **Parser** (bukan ReadEmitter) | **Fix paling besar**: Route→Resource linkage + `ResponseDescriptor` (transport/shape/status/contentType) lengkap |

`LaravelRouteParser.ts` dan `incremental.ts` beda kelas dari 5 file lain —
mereka bukan bagian dari `ReadEmitter`/`ContractGenerator` (TypeScript
codegen), tapi parser PHP-embedded + caching layer yang bikin
`routesync.manifest.json` dari source code Laravel. Bug di sini adalah
ROOT CAUSE dari mayoritas gejala yang tadinya "ditambal" di level
`ReadEmitter` (lihat `ISSUE-manifest-resource-linkage.md`).

## Cara pakai

Timpa langsung ke lokasi yang sama di repo `RouteSync` lu:
- `01-resource-naming.ts` → `packages/core/src/utils/resource-naming.ts`
- `03-ReadEmitter.ts` → `packages/cli/src/generators/layers/ReadEmitter.ts`
- `04-manifest-enricher.ts` → `packages/cli/src/generators/layers/utils/manifest-enricher.ts`
- `ContractGenerator.ts` → `packages/cli/src/generators/ContractGenerator.ts`
- `ContractIRBuilder.ts` → `packages/core/src/ir/ContractIRBuilder.ts`
- `incremental.ts` → `packages/cli/src/utils/incremental.ts`
- `LaravelRouteParser.ts` → `packages/cli/src/parsers/LaravelRouteParser.ts`

```bash
cd RouteSync
npm install --legacy-peer-deps
npx tsup

# HAPUS manifest lama dulu sebelum scan ulang — kalau ga, bisa kena bug
# #13 (stale cache) meski sudah di-patch, karena hash lama masih nyantol
# di file yang belum di-regenerate sejak fix. Aman & disarankan selalu
# hapus manifest lama tiap kali abis ganti versi RouteSync.
rm <path-project-laravel>/routesync.manifest.json
rm <path-project-laravel>/routesync.ir.json

# regenerate manifest (butuh PHP + koneksi DB aktif ke project Laravel-nya)
node dist/cli.js scan <path-project-laravel> --models --output routesync.manifest.json

# generate ulang api-read.ts dkk
node dist/cli.js generate-v2 -m routesync.manifest.json -o ./output --verbose
```

**Catatan koneksi DB kalau project Laravel-nya jalan di Docker:** kalau
`.env` project pakai `DB_HOST=mysql` (nama service Docker Compose) dan
command `scan` dijalanin dari host (bukan dari dalam container), koneksi
DB bakal gagal (`getaddrinfo for mysql failed`) dan `manifest.models`
keluar kosong/nyaris kosong — bukan bug RouteSync, override aja:
```bash
DB_HOST=127.0.0.1 DB_PORT=<port-mysql-yang-di-expose-ke-host> node dist/cli.js scan ...
```

## 19 root-cause bug/fase yang di-fix (urutan kronologis)

| # | File | Masalah | Fix |
|---|------|---------|-----|
| 1 | `resource-naming.ts` | `resourceBaseName()` strip suffix `"Resource"` → `OrderResource` dan model `Order` collapse jadi 1 nama, saling nabrak | Stop strip suffix — jadi identity function. `OrderResourceTransformed` dan `OrderTransformed` sekarang coexist sebagai 2 interface beda |
| 2 | `manifest-enricher.ts` | Dedupe resource inferred vs authored bandingin nama mentah (`"Order"` vs `"OrderResource"`) — ga pernah match | Bandingin pake `resourceBaseName()` di kedua sisi |
| 3 | `ContractGenerator.ts` | `adaptManifest()` cuma baca `manifest.resources`, `manifest.models` (kolom DB asli) ga pernah disentuh → banyak model hilang total dari output | Convert tiap `manifest.models[]` jadi `ParsedResource` juga |
| 4 | `ReadEmitter.ts` | `emitPrimitiveToTypeScript()` ga punya case `'datetime'` — field macam `createdAt` jatuh ke `unknown` | Tambah `case 'datetime': return 'string'` |
| 5 | `manifest-enricher.ts` | `extractResources()` cuma nangkep response `kind:'model'`/`'resource'` — route GET dengan response `kind:'object'` ad-hoc ga pernah dikasih nama | Port rule dari `ZodTierGenerator.ts` (engine lama): derive nama dari path pakai `deriveGroupName()` + `toTypeName()`, GET-only |
| 6 | `manifest-enricher.ts` | `generate-v2.ts` manggil `ManifestEnricher.enrich()` 2x (command + internal), hasil pass ke-2 kadang beda dari pass ke-1 | `enrich()` jadi idempotent lewat marker `enrichmentMetadata` |
| 7 | (data manifest) | 10 route cart/checkout semua resolve ke resource `"Order"` yang sama, field-nya ke-gabung jadi 1 interface frankenstein | Fix #3+#9+#10 otomatis nyelesaiin — `OrderTransformed` konsisten ambil dari `manifest.models` |
| 8 | `ContractGenerator.ts` | Percobaan fix kolisi model-vs-resource pake `endpoints.length <= 1` — kebablasan, ngerusak `Order`/`Payment`/`ProdukItem` | Di-revert total, dedupe yang bener ada di fix #9/#10 |
| 9 | `manifest-enricher.ts` | `inferModels()` bikin model duplikat (`"Register"` dari resource `RegisterResponse`) | Skip infer model untuk resource ber-suffix `"Response"` |
| 10 | `manifest-enricher.ts` | Fix #9 kesempit — 5 resource GET-fallback ga ada suffix, masih nabrak | General-kan: skip infer model kecuali resource punya route `kind==='model'`/`'resource'` beneran DAN bukan suffix `Response` |
| 11 | **`LaravelRouteParser.ts`** | `#[Response(Order::class)]` attribute langsung commit ke `$responseMetadata`, Resource Discovery (detect `return new OrderResource(...)`) NEVER RUN — Route→Resource linkage hilang total. **Root cause mayoritas gejala di fix #1-10** | Attribute cuma nyimpen model hint terpisah, Resource Discovery SELALU jalan dan MERGE, bukan overwrite. Pattern regex diperluas (`::make()`, `DB::transaction()`, `tap()`, dll) |
| 12 | `ContractIRBuilder.ts` | `field.resolved.type === 'resource'`/`'model'` ke-treat sebagai primitive type name, field nested resource reference kolaps ke `unknown` | Guard whitelist `PRIMITIVE_RESOLVED_TYPES` — `items: OrderDetailResourceTransformed[]` |
| 13 | `incremental.ts` | Hash cache route cuma dari kode sendiri (bukan model availability) — scan pertama (DB gagal connect) hasilnya ke-cache, scan kedua (DB udah connect) COPY hasil lama, ga di-resolve ulang | `calculateRouteHash()` sekarang ikut hash daftar nama model yang tersedia — cache otomatis invalid begitu model availability berubah |
| 14 | `LaravelRouteParser.ts` (ResponseDescriptor Fase 1) | Manifest cuma punya `kind`/`model`/`resource`/`collection` — ga ada representasi terpisah "wire format" vs "shape" | Tambah `transport` (resource/model/json/...) + `shape` (single/collection/paginated) — derived dari data lama, purely additive, 0 regresi |
| 15 | `ContractGenerator.ts` (ResponseDescriptor Fase 2) | Reachability filter masih baca `resp.kind` langsung | Prefer `resp.transport`, fallback ke `kind` (backward compat manifest lama) |
| 16 | `LaravelRouteParser.ts` (ResponseDescriptor Fase 3) | Route yang return `download`/`redirect`/`empty` (bukan JSON) selalu warning "Response type could not be inferred" — bukan krn ambigu, tapi krn ga ada yg nyari pattern ini sama sekali | Deteksi `->download()`, `redirect()`, `->noContent()`, dll → `transport:'download'/'redirect'/'empty'`. Plus subkasus `return response()->json($var)` (variable-built JSON) — reuse `$assignments` yang udah ada tapi ga pernah dipake |
| 17 | `LaravelRouteParser.ts` (ResponseDescriptor Fase 4) | Ga ada info `status`/`contentType` di manifest — emitter lain (OpenAPI/SDK) bakal butuh infer ulang | Tambah `deriveStatusAndContentType()` — default per-transport + override dari `response()->json($x, XXX)` eksplisit |
| 18 | `LaravelRouteParser.ts` | Assignment scanner cuma nangkep `$var = [...]` langsung — pattern `$var = []; $var['key'] = ...;` (incremental array construction, dibangun bertahap lewat beberapa statement) ga pernah ke-track sama sekali | Tambah scanner kedua khusus `$var['key'] = expr;`, digabung sama base assignment lewat `mergeAssignmentShape()` — verified: `forgot-password` sekarang resolve `message` DAN `reset_token` (field kedua ini yang tadinya hilang) |
| 19 | `ContractIRBuilder.ts` | Field object-kind nested (`shipping`, `promotion` di `OrderResource`) selalu render sebagai anonymous inline `{ nama: string; alamat: string }` — ga ada nama interface sendiri, field-nya juga masih snake_case | `extractNestedObjectResource()` — extract jadi resource baru bernama `${ParentBase}${PascalField}` (mis. `OrderShipping`), register ke `this.resources`, field aslinya jadi reference. Sengaja TIDAK reuse model DB yang namanya kebetulan sama — shape-nya murni dari field yang genuinely ada di response. Bonus: field ikut ke-camelCase karena reuse pipeline yang sama kayak field top-level |

**Verifikasi final (di project asli `toko-online`, bukan fixture):** abis
fix #19, `generate-v2` terhadap manifest asli hasilnya **21 interface**
(naik dari 15 sebelum fix #19 — 6 interface baru:
`OrderShipping`/`OrderPromotion`/`PaymentGateway`/`PaymentPromotion`/
`OrderDetailProduk`/`ProdukReviewsSummary`), `OrderResourceTransformed`
semua field-nya jadi reference bersih
(`items: OrderDetailResourceTransformed[]`,
`promotion: OrderPromotionTransformed`,
`shipping: OrderShippingTransformed`), dan `OrderShippingTransformed`
sendiri field-nya udah camelCase (`kodePos`, bukan `kode_pos`). 0 regresi.

## Catatan / known follow-up (belum di-fix)

- **Field yang datanya emang ga ke-resolve di manifest** (`Categories.data`,
  `OauthRedirect.provider`, `ProdukReviews.reviews`, nested field
  `PaymentResourceTransformed.gateway.*`) — masih `unknown`. Beda dari bug
  #13 (itu soal CACHE nyimpen hasil lama); ini soal resolver PHP genuinely
  gagal resolve untuk pattern tertentu. Belum diinvestigasi lebih dalam.
- **`payment_webhook.post`** — BUKAN bug RouteSync. Route ini nunjuk ke
  `PaymentController::webhook()` yang **ga pernah diimplementasikan** di
  kode Laravel-nya sama sekali (cuma ada `__construct`+`store`). Parser
  udah bener return `null` karena emang ga ada apa-apa buat di-parse.
  Implementasi lengkap (pakai `MidtransGateway::isValidSignature()` yang
  udah ada tapi belum pernah dipanggil dari mana pun) sudah disiapkan
  terpisah — lihat `PaymentController-webhook-method.txt` — tinggal
  di-paste ke controller-nya dan ditest di sandbox Midtrans sebelum
  production.
- **`wrapDetectionPhp` dead code** di `LaravelRouteParser.ts` — gate-nya
  nunggu `$responseMetadata` yang keisi TERLALU AWAL (sebelum fix #11,
  timing-nya masih pas; sekarang enggak). Logic-nya lebih canggih dari
  yang sekarang dipakai (resolve `use` alias, tangkep `DB::transaction()`)
  — worth dikonsolidasi jadi satu `WrapResolver`, bukan dihapus asal-asalan.
  Satu-satunya item follow-up dari daftar sebelumnya yang masih genuinely
  belum dikerjakan.

**Yang tadinya ada di list ini tapi sekarang sudah selesai:** incremental
array construction (bug #18), nested inline object → named interface
(bug #19), dan automated test suite (`test-suite.sh` +
`test-manifest-fixture.json`, 25 assertion, terverifikasi genuinely nangkep
regresi).

## Daftar file di sini

```
README.md                          <- file ini
ISSUE-manifest-resource-linkage.md <- analisis mendalam bug #11 + proposal ResponseDescriptor (sudah diimplementasi penuh, bug #14-17)
01-resource-naming.ts              -> packages/core/src/utils/resource-naming.ts
03-ReadEmitter.ts                  -> packages/cli/src/generators/layers/ReadEmitter.ts
04-manifest-enricher.ts            -> packages/cli/src/generators/layers/utils/manifest-enricher.ts
ContractGenerator.ts               -> packages/cli/src/generators/ContractGenerator.ts
ContractIRBuilder.ts               -> packages/core/src/ir/ContractIRBuilder.ts (termasuk bug #19, nested object extraction)
incremental.ts                     -> packages/cli/src/utils/incremental.ts
LaravelRouteParser.ts              -> packages/cli/src/parsers/LaravelRouteParser.ts (termasuk bug #18)
test-suite.sh                      <- automated regression test, 25 assertion, cakupan bug #1-12+#15+#19 (sisi TypeScript)
test-manifest-fixture.json         <- fixture statis buat test-suite.sh, ga butuh PHP/DB
PaymentController-webhook-method.txt <- implementasi payment_webhook (bukan bug RouteSync, gap di kode Laravel)
output-api-read.ts                 <- CATATAN: hasil generate-v2 dari manifest LAMA (sebelum bug
output-api-form.ts                    #13-19). Verifikasi FINAL (21 interface, semua nested object
output-api-contract.ts                jadi reference bersih) sudah dijalankan langsung terhadap
output-api-field.ts                   project toko-online — lihat tabel bug #19 di atas untuk hasil
output-api-mapper.ts                  lengkapnya. File-file di sini TIDAK direfresh ulang; kalau
output-api-schema.ts                  butuh output paling akurat, regenerate sendiri pakai instruksi
output-sdk-api.ts                     "Cara pakai" di atas.
```