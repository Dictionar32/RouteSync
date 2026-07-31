# RouteSync ReadEmitter (v2) — Bug Fix Backup

Backup dari sesi debugging `generate-v2` (Contract IR Architecture) — target: bikin
`types/api-read.ts` yang di-generate dari `ecommerce_shop-main` match persis sama
`api-read.ts` ground-truth (29 interface, hasil generate dari `zodtiergenerator`
engine lama).

**Hasil akhir: 29/29 nama interface match persis, 0 duplikat.**
Lihat `generated-output/types/api-read.ts` untuk hasil final.

## Cara pakai (langsung timpa ke repo)

Zip ini strukturnya udah dibikin match root `RouteSync-main/` — tinggal extract
langsung DI DALAM folder repo lu (timpa), 5 file source otomatis ke-replace:

```bash
cd /path/ke/RouteSync-main
unzip -o routesync-readmitter-fix-backup.zip -d .
# atau kalau nama folder repo lu beda dari "RouteSync-main":
unzip -o routesync-readmitter-fix-backup.zip
cp -r RouteSync-main/packages/* /path/ke/repo/lu/packages/

npm install --legacy-peer-deps
npx tsup

node dist/cli.js generate-v2 \
  -m _routesync-fix-backup/test-manifest/routesync.manifest.json \
  -o ./output --verbose
```

Folder `_routesync-fix-backup/` (dengan underscore prefix, sengaja biar gampang
kebeda dari source asli & gampang di-`.gitignore`) isinya dokumentasi, manifest
test, sama hasil generate final — BUKAN bagian dari source code, aman kalau mau
dihapus abis dicek.



1. `packages/core/src/utils/resource-naming.ts`
2. `packages/core/src/ir/ContractIRBuilder.ts`
3. `packages/cli/src/generators/layers/ReadEmitter.ts`
4. `packages/cli/src/generators/layers/utils/manifest-enricher.ts`
5. `packages/cli/src/generators/ContractGenerator.ts`

Copy langsung timpa ke lokasi yang sama di repo — semua path di atas relatif dari
root repo RouteSync.

## 10 root-cause bug yang di-fix (urutan kronologis)

| # | File | Masalah | Fix |
|---|------|---------|-----|
| 1 | `resource-naming.ts` | `resourceBaseName()` strip suffix `"Resource"` → `OrderResource` dan model `Order` collapse jadi 1 nama, saling nabrak | Stop strip suffix — `resourceBaseName()` jadi identity function. `OrderResourceTransformed` (dari Resource class) dan `OrderTransformed` (dari DB model) sekarang coexist sebagai 2 interface beda, sesuai ground truth |
| 2 | `manifest-enricher.ts` | Dedupe resource inferred vs authored bandingin nama mentah (`"Order"` vs `"OrderResource"`) — ga pernah match | Bandingin pake `resourceBaseName()` di kedua sisi (jadi otomatis no-op konsisten sejak fix #1) |
| 3 | `ContractGenerator.ts` | `adaptManifest()` cuma baca `manifest.resources`, `manifest.models` (kolom DB asli) ga pernah disentuh sama sekali → 21 model (`Category`, `User`, `Wishlist`, dll) hilang total dari output | Tambah jalur baru: convert tiap `manifest.models[]` jadi `ParsedResource` juga (nama bare, kolom SQL → semantic type, filter kolom `hidden`) |
| 4 | `ReadEmitter.ts` | `emitPrimitiveToTypeScript()` ga punya case `'datetime'` (cuma `'date'`) — field macam `createdAt` jatuh ke `unknown` padahal harusnya `string` | Tambah `case 'datetime': return 'string'` |
| 5 | `manifest-enricher.ts` | `extractResources()` cuma nangkep response `kind:'model'`/`'resource'` — 5 route GET dengan response `kind:'object'` ad-hoc (`categories.get`, `oauth_provider_redirect.get`, `oauth_provider_callback.get`, `produk_id_reviews.get`, `profile.get`) ga pernah dikasih nama sama sekali → interface `Categories`, `OauthRedirect`, `OauthCallback`, `ProdukReviews`, `Profile` hilang | Port rule dari `ZodTierGenerator.ts` (engine lama): kalau response `kind==='object'` DAN method `GET` DAN belum ada nama, derive nama dari path pakai `deriveGroupName()` + `toTypeName()` (fungsi yang udah ada di `route-classifier.ts`/`names.ts`). Non-GET object routes (`login`, `logout`, `wishlist.post`, dll) sengaja tetap ga dikasih nama, sesuai ground truth |
| 6 | `manifest-enricher.ts` | `generate-v2.ts` (command) manggil `ManifestEnricher.enrich()` DULU sebelum manggil `ContractGenerator.generate()`, yang manggil `enrich()` LAGI di dalemnya → manifest ke-enrich 2x, hasil pass ke-2 kadang beda dari pass ke-1 | `enrich()` sekarang idempotent — cek marker `enrichmentMetadata`, kalau udah ada langsung return manifest apa adanya |
| 7 | (data manifest, bukan bug kode) | 10 route cart/checkout (`orders.get`, `checkout.post`, `cart_items.post`, `buy-now.post`, dll) semua resolve ke resource `"Order"` yang sama, field-nya ke-gabung (`populateResourceFields`) jadi 1 interface frankenstein | Fix #3+#9+#10 (dedupe model vs resource) otomatis nyelesaiin ini — `OrderTransformed` sekarang konsisten ambil dari `manifest.models` (DB asli), bukan dari resource multi-route yang berantakan |
| 8 | `ContractGenerator.ts` | Percobaan fix kolisi model-vs-resource pake `endpoints.length <= 1` — kebablasan, `OrderResource`/`PaymentResource`/`ProdukItemResource` punya `endpoints: 0` di manifest asli (bukan genuinely "1 endpoint", cuma field yang emang ga pernah diisi buat hand-authored resource) → ke-exclude juga → `Order`/`Payment`/`ProdukItem` balik rusak | Filter ini di-revert total dari `ContractGenerator.ts` — dedupe yang bener ada di fix #9/#10, di `manifest-enricher.ts` |
| 9 | `manifest-enricher.ts` | `inferModels()` bikin model duplikat buat SETIAP resource di `resourcesMap` tanpa cek apakah model itu udah ada — `RegisterResponse` (resource) → `inferModels()` bikin model `"Register"` (suffix `Response` di-strip lewat `extractBaseModelName`), nabrak sama resource `RegisterResponse` sendiri, muncul interface asing `RegisterTransformed` | Skip infer model untuk resource ber-suffix `"Response"` (fix awal, sempit) |
| 10 | `manifest-enricher.ts` | Fix #9 kesempit — 5 resource GET-fallback (fix #5) ga ada suffix sama sekali, jadi masih nabrak juga jadi 30 interface (bukan 29) | General-kan jadi: skip infer model kecuali resource itu punya route dengan `response.kind === 'model'`/`'resource'` beneran DAN bukan suffix `Response`. `RegisterResponse` responsenya emang `kind:'model'` juga (parser resolve nama kelasnya sebagai referensi model walau bukan Eloquent beneran), makanya kedua syarat dipakai bareng |

## Catatan / known follow-up (belum di-fix)

- Field yang sumbernya `kind: 'raw_code'` tanpa `.resolved` (misal `Categories.data`,
  `OauthRedirect.provider`) ke-render sebagai `unknown`, bukan tipe spesifik
  (`CategoryTransformed[]`, `string`). Ini akurat/jujur (manifest emang ga resolve
  tipe pastinya), tapi kurang presisi dibanding target. Perlu tracing lebih dalam
  ke arah nested object/array flattening kalau mau match 100% ke level field.
- `ProdukReviews.reviews` seharusnya jadi array/paginator `ProductReviewTransformed[]`,
  sekarang masih `unknown`.
- Semua fix di atas SUDAH diverifikasi jalan bareng lewat run CLI beneran
  (`node dist/cli.js generate-v2 ...`), bukan asumsi — tapi belum ada automated
  test/regression suite. Kalau nambah fix baru, WAJIB re-run comparison manual
  kayak yang didokumentasikan di atas (diff nama interface + spot-check field per
  interface), karena beberapa fix di sesi ini saling tarik-menarik (fix #8 contoh
  nyata: benerin 1 kasus, ngerusak kasus lain, ke-revert lagi).

## Struktur zip ini

```
RouteSync-main/                          <- extract langsung ke root repo lu
├── packages/                            <- 5 file source hasil fix (timpa langsung)
│   ├── core/src/utils/resource-naming.ts
│   ├── core/src/ir/ContractIRBuilder.ts
│   └── cli/src/generators/
│       ├── ContractGenerator.ts
│       └── layers/
│           ├── ReadEmitter.ts
│           └── utils/manifest-enricher.ts
└── _routesync-fix-backup/               <- bukan source code, aman dihapus
    ├── README.md                        <- file ini
    ├── generated-output/                <- hasil generate-v2 final (7 file)
    └── test-manifest/
        └── routesync.manifest.json      <- manifest test (dari ecommerce_shop-main/frontend/)
```
