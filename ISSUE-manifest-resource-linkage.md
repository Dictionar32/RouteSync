# [FIXED, VERIFIED & FULLY IMPLEMENTED] ResponseDescriptor — Parser Route→Resource linkage + transport/shape/status/contentType

## Status implementasi (update terakhir)

Dokumen ini awalnya proposal arsitektur. **Sekarang semua sudah
diimplementasi dan diverifikasi**, dalam 4 fase bertahap (lihat
`README.md` bug #14-17 untuk detail per-fase):

| Fase | Isi | Status |
|---|---|---|
| 0 | Route→Resource linkage dasar (`kind`/`model`/`resource`/`collection`) | ✅ (bug #11) |
| 1 | `transport` + `shape` — turunan dari data Fase 0, purely additive | ✅ (bug #14) |
| 2 | `ReadEmitter`/`ContractGenerator` baca `transport` (backward compat) | ✅ (bug #15) |
| 3 | Deteksi `download`/`stream`/`redirect`/`empty` + variable-built JSON | ✅ (bug #16) |
| 4 | `status` + `contentType` | ✅ (bug #17) |

Satu penyesuaian dari desain awal di dokumen ini: draft pertama pakai
`responseType` (satu enum gabung 2 dimensi: `resource`/`resourceCollection`/
`model`/`modelCollection`/...) — ini KEMUDIAN dipecah jadi `transport`
(wire format) + `shape` (single/collection/paginated) yang ortogonal,
karena `responseType` lama nyimpen info "collection" dua kali (contoh
kasus janggal: `OrderResource::collection($orders->paginate())` jadi
`responseType: "resourceCollection"` + `shape: "paginated"` — kata
"collection" nongol 2x padahal 1 fakta). Implementasi final pakai
`transport`+`shape` yang ortogonal ini, bukan `responseType`.

Yang **belum** diimplementasi dari proposal ini: `ReadEmitter` belum jadi
FULLY pure emitter (masih ada reachability-filter berbasis
`manifest.models`, bukan murni switch atas `transport`) — karena
reachability-filter itu sendiri masih perlu buat kasus model yang genuinely
ga pernah nongol di response manapun (lihat README bug #3). Simplifikasi
lebih lanjut ke arah pure-switch masih mungkin tapi belum dikerjakan.

---

## Ringkasan (analisis awal, sebelum fix)

`routesync.manifest.json` mencatat response beberapa route sebagai
`{ kind: "model", model: "Order" }` — padahal kode controller aslinya
mengembalikan `OrderResource`/`OrderResource::collection(...)`, bukan model
mentah. Parser belum membedakan dua konsep yang sebenarnya berbeda:

- **Model** (`Order`) — Eloquent model, representasi domain/database
- **Wire shape** (`OrderResource`) — bentuk aktual yang dikirim ke client

Manifest saat ini cuma menyimpan salah satunya (model), sedangkan wire
shape yang benar-benar relevan untuk generate tipe TypeScript hilang di
proses parsing.

Ini bukan salah tebak generator TypeScript (`RouteSync`/`ReadEmitter`) —
manifest-nya sendiri yang kehilangan data ini di tahap parsing/resolusi PHP,
sebelum sampai ke RouteSync sama sekali.

## Bukti konkret (3 controller, pattern konsisten)

**`app/Http/Controllers/OrderController.php`**
```php
#[Response(Order::class, collection: true)]
public function index(Request $request)
{
    $orders = Order::where('user_id', $request->user()->id)
        ->with(['details.produkItem.frontend', 'payment', 'shipping', 'promotion.promoCode'])
        ->latest()
        ->get();

    return OrderResource::collection($orders);   // <- Resource, bukan Model
}

#[Response(Order::class)]
public function show(Request $request, int $id)
{
    $order = Order::where('user_id', $request->user()->id)
        ->with([...])
        ->findOrFail($id);

    return new OrderResource($order);            // <- Resource, bukan Model
}
```

**`app/Http/Controllers/PaymentController.php`**
```php
#[Response(Payment::class)]
public function store(StorePaymentRequest $request, int $orderId)
{
    // ...
    return new PaymentResource($payment);         // <- Resource, bukan Model
}
```

**`app/Http/Controllers/ProdukController.php`**
```php
#[Response(ProdukItem::class, collection: true)]
public function index(Request $request) { ... return ProdukItemResource::collection($produk); }

#[Response(ProdukItem::class)]
public function show($id) { ... return new ProdukItemResource($produk); }
```

Ketiganya sama polanya: `#[Response(...)]` selalu diisi nama **Model**
(`Order::class`, `Payment::class`, `ProdukItem::class`), padahal `return`
statement di body method selalu berupa **Resource** class
(`OrderResource`, `PaymentResource`, `ProdukItemResource`).

## Definisi attribute-nya sendiri (`app/Attributes/Response.php`)

```php
#[\Attribute(\Attribute::TARGET_METHOD)]
class Response
{
    public function __construct(
        public string $type,
        public bool $collection = false
    ) {}
}
```

`$type` cuma 1 field generic — ga ada cara buat attribute ini bedain
"ini Model" vs "ini Resource" dari data attribute-nya sendiri. Jadi kalau
manifest generator naive baca `$type` sebagai identitas response, dia bakal
selalu dapat nama Model, ga peduli return statement-nya apa.

## Root cause candidate (butuh dicek langsung ke parser)

Perlu hati-hati di sini: kemungkinan besar `#[Response(Order::class)]`
**memang tidak pernah didesain untuk menyimpan Resource class** — dia cuma
menyimpan Eloquent model yang direpresentasikan endpoint tersebut
(`Order`), bukan *wire shape*-nya (`OrderResource`). Dua hal ini secara
semantik memang berbeda:

- **Model**: Eloquent model yang direpresentasikan (`Order`)
- **Wire shape**: bentuk aktual yang dikirim ke client (`OrderResource`,
  bisa jadi collection, bisa jadi paginated, dll)

Kalau itu benar, maka bukan bug di attribute-nya, dan bukan juga
"developer salah nulis attribute" — belum ada bukti developer salah paham.
Root cause yang lebih akurat: **manifest/parser belum menyimpan kedua
informasi ini sekaligus**. Yang tersimpan cuma model-nya (`Order`),
sedangkan representasi wire yang benar-benar dikirim ke client
(`OrderResource`) hilang di proses parsing — padahal parser SEHARUSNYA
bisa membaca `return new OrderResource($order)` langsung dari body method.

## Manifest yang seharusnya: `ResponseDescriptor`

Daripada nambahin field satu-satu secara ad-hoc, semantic IR-nya sebaiknya
punya satu bentuk terstruktur yang eksplisit dan menutup semua kasus
response yang mungkin muncul di Laravel — bukan cuma kasus Resource, dan
bukan cuma yang kepake di codebase ini sekarang. Kalau nanti ada endpoint
`response()->download(...)`/`redirect()->route(...)`/`response()->stream(...)`
di proyek lain (atau ditambahin belakangan di proyek ini), semantic IR-nya
udah punya tempat buat itu sejak awal — ga perlu nambah kasus baru ke enum
satu-satu tiap ketemu pattern baru:

```typescript
interface ResponseDescriptor {
    transport:
        | "resource"   // new XResource(...), XResource::make(...), XResource::collection(...)
        | "model"      // return Eloquent model/collection mentah, tanpa Resource wrapper
        | "json"       // response()->json([...]) — array/object literal ad-hoc
        | "primitive"  // return string/bool/int polos
        | "stream"     // response()->stream(...)
        | "binary"     // response()->file(...), download file
        | "download"   // response()->download(...)
        | "redirect"   // redirect()->route(...), redirect()->back(), dll
        | "empty";     // response()->noContent(), return void

    model?: string;      // nama Eloquent model, kalau relevan (mis. "Order")
    resource?: string;   // nama Resource class, kalau transport === "resource" (mis. "OrderResource")
    shape: "single" | "collection" | "paginated";
    nullable?: boolean;  // true kalau response bisa null (mis. findOrFail vs first())
    status?: number;     // HTTP status code (200, 201, 204, 302, 404, ...)
    contentType?: "application/json" | "text/plain" | "application/pdf" | "application/octet-stream" | string;
}
```

Tiga penyesuaian dari draft sebelumnya:

1. **`responseType` (yang tadinya nyampur 2 dimensi jadi 1 enum) →
   dipecah jadi `transport` + `shape` yang ortogonal.** Draft sebelumnya
   punya `resource`/`resourceCollection`/`model`/`modelCollection` DAN
   `shape: single | collection | paginated` sekaligus — informasi
   "collection"-nya jadi keulang di dua tempat. Kasus
   `OrderResource::collection($orders->paginate())` bahkan jadi aneh:
   `responseType: "resourceCollection"` tapi `shape: "paginated"` — kata
   "collection" nongol dua kali padahal cuma satu fakta. Sekarang
   `transport` cuma jawab "wire format apa" (resource/model/json/dst),
   `shape` cuma jawab "bentuknya gimana" (single/collection/paginated) —
   dua pertanyaan berbeda, tanpa overlap.
2. **Tambah `status`.** Emitter OpenAPI/SDK/AI-context hampir pasti butuh
   tau status code aktual (200 vs 201 vs 204 beda arti), bukan cuma bentuk
   datanya.
3. **Tambah `contentType`.** Biar emitter downstream (OpenAPI/SDK) ga
   perlu infer ulang dari `transport` (misal nebak `"download"` = pasti
   `application/octet-stream`, padahal bisa PDF/ZIP/dll) — eksplisit dari
   parser sejak awal.

Field `model` dipakai konsisten baik untuk `transport: "resource"` maupun
`"model"` — bedanya cuma ada tidaknya `resource`. Sengaja dipisah dari
istilah "entity" yang ambigu (bisa disalahartikan sebagai konsep ORM/DDD
lain) — `model` langsung jelas maksudnya Eloquent model class.

### Contoh mapping AST → descriptor

```php
return new OrderResource($order);
```
↓
```json
{ "transport": "resource", "resource": "OrderResource", "model": "Order", "shape": "single", "status": 200, "contentType": "application/json" }
```

```php
return OrderResource::collection($orders);
```
↓
```json
{ "transport": "resource", "resource": "OrderResource", "model": "Order", "shape": "collection", "status": 200, "contentType": "application/json" }
```

```php
return OrderResource::collection($orders->paginate(20));
```
↓
```json
{ "transport": "resource", "resource": "OrderResource", "model": "Order", "shape": "paginated", "status": 200, "contentType": "application/json" }
```

Tidak ada lagi kata "collection" yang nongol dua kali — `transport` tetap
`"resource"` di ketiga kasus, yang berubah cuma `shape`.

```php
return response()->json(["ok" => true]);
```
↓
```json
{ "transport": "json", "shape": "single", "status": 200, "contentType": "application/json" }
```

```php
return response()->download($path);
```
↓
```json
{ "transport": "download", "shape": "single", "status": 200, "contentType": "application/octet-stream" }
```

```php
return redirect()->route("orders.index");
```
↓
```json
{ "transport": "redirect", "shape": "single", "status": 302 }
```

## Arah perbaikan

**Return statement (AST) adalah satu-satunya source of truth untuk
`ResponseDescriptor`.** Parser membaca body method langsung, mengenali
seluruh pola umum Laravel — bukan cuma `new XResource(...)`:

```php
new OrderResource(...)
OrderResource::make(...)
OrderResource::collection(...)
JsonResource::collection(...)
AnonymousResourceCollection / ResourceCollection
response()->json(...)
inertia(...)
```

`#[Response(Order::class)]` **tetap dipertahankan apa adanya**, tidak perlu
diubah — dia tetap metadata yang sah untuk "endpoint ini bicara soal model
`Order`", terpisah total dari `ResponseDescriptor` yang jadi tanggung
jawab parser membaca dari AST, bukan dari attribute.

Sempat dipertimbangkan opsi memperluas attribute jadi
`#[Response(model: Order::class, resource: OrderResource::class)]`, tapi
ini **ditolak** — itu artinya satu informasi (resource class) harus ditulis
manual di dua tempat (attribute DAN return statement), yang gampang drift:
kalau developer ganti `return new OrderResource(...)` jadi
`return new OrderV2Resource(...)` tapi lupa update attribute-nya, muncul
dua sumber kebenaran yang saling kontradiksi — rawan basi persis seperti
masalah yang lagi coba di-fix ini.

## Dampak ke RouteSync (downstream)

Begitu manifest membawa `ResponseDescriptor` yang lengkap per route, rule
`ReadEmitter` jadi sangat sederhana — murni iterasi descriptor, tanpa
tebakan atau fallback sama sekali:

```typescript
for (const response of manifest.responses) {
    switch (response.transport) {
        case "resource":
            emitResource(response); // field dari struktur Resource class
            // response.shape (single/collection/paginated) nentuin bentuk akhirnya
            break;

        case "model":
            emitModel(response); // field dari manifest.models (lookup, bukan sumber keputusan)
            break;

        case "json":
        case "primitive":
            emitInline(response); // struktur data yang ada di response langsung
            break;

        // stream / binary / download / redirect / empty:
        // di luar scope api-read.ts (bukan representasi data JSON), skip
    }
}
```

1. `transport === "resource"` → generate `${resource}Transformed`,
   field-nya dari struktur Resource class (bukan dari `manifest.models`).
   `shape` (`"single"`/`"collection"`/`"paginated"`) menentukan apakah
   hasil akhirnya interface tunggal, array, atau paginated wrapper — satu
   field ini aja, ga perlu varian transport terpisah buat tiap kombinasi.
2. `transport === "model"` → generate `${model}Transformed`, field-nya
   BARU di titik ini boleh diambil dari `manifest.models` — karena
   response-nya memang benar-benar raw model, bukan Resource-wrapped,
   jadi field DB adalah representasi yang akurat. `shape` tetap berlaku
   sama (single/collection/paginated model).
3. `transport === "json"`/`"primitive"` → generate inline type dari
   struktur data yang ada di response (path yang sudah ada sekarang,
   dipertahankan).
4. `transport === "stream"`/`"binary"`/`"download"`/`"redirect"`/`"empty"`
   → di luar scope `api-read.ts` (bukan representasi data JSON), skip.
   `contentType`/`status` di descriptor tetap berguna buat emitter lain
   (OpenAPI dll) meski `api-read.ts` sendiri skip.
5. **`manifest.models` tidak pernah dibaca untuk MENENTUKAN apa yang harus
   digenerate** — dia cuma dipakai untuk MENGISI field suatu model yang
   sudah dipastikan relevan lewat langkah 2 di atas. Perannya berubah dari
   "sumber generate" jadi "sumber lookup field", dan cuma dipanggil kalau
   descriptor sudah bilang `transport === "model"`.

Dengan invariant ini, `ReadEmitter` jadi pure emitter — dia menerjemahkan
semantic graph yang sudah lengkap jadi TypeScript, tanpa logika inferensi
apa pun. Seluruh keputusan "apa yang harus digenerate" sudah selesai di
tahap parser/semantic analysis, bukan tanggung jawab emitter.

### Manfaatnya bukan cuma buat ReadEmitter

Begitu `ResponseDescriptor` ada di manifest sebagai satu sumber data yang
lengkap, emitter lain yang mungkin ada/akan ada di RouteSync juga bisa
langsung pakai struktur yang sama tanpa perlu bikin heuristik sendiri-
sendiri: OpenAPI emitter, SDK emitter, query/hook emitter (React Query dkk),
sampai emitter yang nge-generate context buat AI tooling. `status` dan
`contentType` khususnya jadi krusial buat OpenAPI/SDK emitter — dua field
itu ga relevan buat `ReadEmitter` (yang cuma peduli shape data), tapi
mubazir kalau parsernya HARUS dijalanin ulang tiap kali emitter baru butuh
informasi itu. Sekali `ResponseDescriptor` lengkap, semua emitter baca satu
sumber kebenaran yang sama, bukan masing-masing nebak ulang dari manifest
yang setengah lengkap seperti sekarang.

## Skala masalah (sudah di-audit + diverifikasi lewat eksekusi nyata)

Ada 6 controller yang pakai `#[Response(...)]` attribute total:

| Controller | Pattern | Status |
|---|---|---|
| `OrderController` | `#[Response(Order::class)]` + return `OrderResource`/`OrderResource::collection` | wire shape hilang |
| `PaymentController` | `#[Response(Payment::class)]` + return `PaymentResource` | wire shape hilang |
| `ProdukController` | `#[Response(ProdukItem::class)]` + return `ProdukItemResource`/`::collection` | wire shape hilang |
| `WishlistController` | `#[Response(ProdukItem::class, collection: true)]` + return `ProdukItemResource::collection($items)` | wire shape hilang |
| `PromoController` | `#[Response(Order::class)]` + return `new OrderResource($order->load([...]))` (di dalam `DB::transaction` closure) | wire shape hilang |
| `AuthController::register` | `#[Response(RegisterResponse::class)]` | model = wire shape (`RegisterResponse` bukan Eloquent model terpisah), tidak ada info yang hilang |

**Koreksi dari audit manual sebelumnya:** baris `WishlistController` di atas
tadinya ditulis sebagai "tidak ada info yang hilang" — itu salah, hasil
salah baca source manual (audit visual sempat berhenti di baris
`->pluck('produkItem')` di tengah method dan mengira itu return value-nya,
padahal itu cuma assignment ke `$items`; `return`-nya ada di baris
berikutnya dan tetap `ProdukItemResource::collection($items)`). Baru
ketauan salah setelah fix di parser dijalankan beneran dan hasilnya
`kind: "resource"` untuk `wishlist.get` — bukan `kind: "model"` seperti
yang diprediksi manual. Ini sekaligus jadi bukti kenapa verifikasi lewat
eksekusi nyata penting, bukan cuma audit baca kode manual — 5 dari 6
kasus di tabel di atas ternyata kena masalah yang sama, bukan 4 dari 6
seperti perkiraan awal.

`AuthController::register` tetap satu-satunya kasus yang genuinely aman —
`RegisterResponse` bukan Eloquent model terpisah dari wire format-nya, jadi
tidak ada informasi yang hilang di situ.

## Status: sudah diimplementasi & diverifikasi

Fix untuk masalah ini (bagian "Arah perbaikan" di atas) sudah
diimplementasikan di `LaravelRouteParser.ts` dan diverifikasi lewat
eksekusi nyata (`node dist/cli.js scan <project> --models`) terhadap
codebase Laravel asli, bukan cuma trace manual. Hasil verifikasi untuk
kelima endpoint yang tadinya kehilangan wire shape:

```
orders.get          -> kind: resource, resource: OrderResource,   collection: true
orders_id.get        -> kind: resource, resource: OrderResource,   collection: false
payment_orderId.post -> kind: resource, resource: PaymentResource, collection: false
wishlist.get          -> kind: resource, resource: ProdukItemResource, collection: true
cart_promo.post       -> kind: resource, resource: OrderResource,   collection: false
cart_promo.delete     -> kind: resource, resource: OrderResource,   collection: false
```

Endpoint yang genuinely bukan Resource (`wishlist.post`, `wishlist_produkItemId.delete`
— ack response `{ message: ... }` biasa) tetap `kind: "object"` seperti
seharusnya, tidak ikut berubah — konfirmasi tidak ada regresi ke jalur yang
sudah benar sebelumnya.

## Kesimpulan

Ini bukan sekadar bug parser kecil, tapi perubahan arsitektur — dan
sekarang sudah diimplementasi penuh, bukan proposal:

1. Parser bertugas menghasilkan semantic `ResponseDescriptor`
   (`transport`+`shape`+`status`+`contentType`) dari AST controller —
   bukan menyalin metadata attribute apa adanya. ✅
2. Manifest menjadi representasi lengkap response HTTP (termasuk kasus
   non-JSON: stream/binary/download/redirect/empty), bukan cuma metadata
   model. ✅
3. `ReadEmitter` (dan emitter lain yang membaca manifest yang sama) baca
   `transport` sebagai sumber utama, dengan fallback ke `kind` lama buat
   backward compat. Belum 100% "tanpa inferensi apa pun" — reachability-
   filter buat `manifest.models` masih ada, lihat catatan status di atas.
4. `manifest.models` tidak menentukan apa yang digenerate, melainkan
   cuma jadi sumber lookup field ketika descriptor sudah menyatakan
   `transport === "model"`. ✅

Dengan pemisahan tanggung jawab ini, keputusan semantik utama sudah selesai
di tahap parsing/analisis, sedangkan emitter downstream jadi jauh lebih
sederhana dan konsisten dibanding sebelumnya.
