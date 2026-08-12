# Analisa — Perbandingan Output ContractCodeBuilder vs Manifest

**Tanggal:** 2026-08-12 (update: bentuk response sudah diperbaiki)
**Status:** Fix bentuk response ✅ SELESAI — kekurangan data masih terbuka
**Lingkup:** Jalur A (`generate`) — `contracts/api-contract.ts`
**Sumber data:** `routesync.manifest.fresh6.json` (35 routes, 20 models, 4 resources)

---

## Ringkasan

Output ContractCodeBuilder (Jalur A) dibandingkan field-per-field dengan manifest:

| Sisi | Status |
|---|---|
| Response `ProdukItemResource` (11 field) | ✅ Lengkap — snake_case asli |
| Response `OrderResource` (16 field) | ✅ Lengkap — nested + snake_case |
| Response nested `items` → OrderDetailResource | ✅ Ter-resolve — nested `produk` object |
| **Response `PaymentResource`** | ❌ **Tidak ada schema sama sekali** |
| Request 15 contracts / 14 actions (60 rule) | ⚠️ 57 OK, 3 bermasalah |

---

## 1. Kekurangan data yang ditemukan

### 1.1 PaymentResource hilang total
- Manifest: `POST /payment/{orderId}` → response `PaymentResource` (16 field).
- Output: tidak ada `paymentResourceShowSchema`.
- **Root cause:** `manifestToContractInput()` hanya mencari
  `routes.find(r => r.response && r.method === 'GET')` — route dengan method
  POST/PUT/PATCH yang me-return resource **dilewati**.
- **Dampak lebih luas:** semua response dari route non-GET tidak pernah
  menghasilkan response schema, padahal manifest mencatatnya:
  `POST /cart/items`, `POST /cart/promo`, `POST /checkout`, `POST /buy-now`,
  `POST /admin/produk`, `PATCH/DELETE /cart/items/{id}` → semuanya me-return
  resource (OrderResource/ProdukItemResource/PaymentResource) tapi tidak
  menghasilkan schema. (`GET /keranjang`, `GET /wishlist` juga tidak — hanya
  route GET pertama per resource yang diproses.)

### 1.2 Rule `array` di-map jadi `z.string()`
- `checkout.items` (`sometimes|array|min:1`) → `items: z.string().optional()`
- `payment.detail` (`nullable|array`) → `z.string()`
- **Root cause:** `FormFieldMapper.mapValidationToType()` tidak punya mapping
  untuk rule `array` → default ke string.

### 1.3 Field array bersarang (`items.*`) hilang + wildcard
- `checkout.items.*.produk_item_id`, `checkout.items.*.qty` → tidak ada di output.
- **Root cause:** `parseValidationRulesPreserveNested()` men-skip semua field
  yang mengandung `.*` (`fieldName.includes('.*')`).

**Jawaban pertanyaan "wildcard `*` gak ada kan?":** **ADA.** Wildcard `*`
ada di manifest (Laravel array validation), 2 field di `POST /checkout`:

```
items                  = sometimes|array|min:1
items.*.produk_item_id = required_with:items|exists:produk_items,id
items.*.qty            = required_with:items|integer|min:1
```

Jadi wildcard bukan kasus teoretis — data nyata hilang karenanya. Parser
**seharusnya** bisa me-resolve `items` (sudah bisa di response side: jadi
`z.array(z.object({...}))`) dan `items.*.x` (elemen dari array tersebut) →
`items: z.array(z.object({ produk_item_id, qty }))` di request schema.
Ini belum diimplementasikan (dibutuhkan struktur RequestField bertingkat /
array-of-object, bukan field datar).

### 1.4 Rule format array (bukan string pipe) hilang
- `profile.update.email` → rule berbentuk JSON array
  `[['sometimes','required','email',{}]]`, bukan string pipe `a|b|c`.
- **Root cause:** parser `ruleString.split('|')` mengasumsikan string;
  `typeof ruleString !== 'string'` → di-skip.

### 1.5 Wajar (bukan bug)
- `logout`, `oauth` tidak muncul — route tanpa rules tidak menghasilkan contract.
- `ordersContractSchema`, `keranjangContractSchema` = `{}` — resource GET-only;
  response schemas-nya tetap ada.

---

## 2. Bentuk output: desain vs realita ⚠️ → ✅ DIPERBAIKI

### Keputusan user (2026-08-12)
> Kembalikan ke snake_case + nested sesuai desain, sesuai yang IR original
> kirim. Jangan di-flatten dan jangan di-camelCase — biarkan datanya original.

### Implementasi (commit berikutnya)
`packages/cli/src/generators/utils/manifest-to-types.ts`:
- Response path TIDAK lagi memakai `flattenResourceFields` — diganti
  `resourceFieldsToNestedTypes()`: nama field apa adanya (snake_case),
  object bersarang tetap `ObjectType`, reference resource (`items` →
  `OrderDetailResource::collection()`) di-resolve ke ObjectType definisi
  resource di manifest (rekursif, guard circular reference).
- Sebelum fix: response di-flatten + di-camelCase-kan (`image_url` →
  `imageUrl`, `shipping.nama` → `shippingNama`).
- Setelah fix — output mengikuti bentuk IR original:

```ts
export const produkItemResourceShowSchema = z.object({
  id: z.number(),
  nama: z.string(),
  deskripsi: z.string(),
  image: z.string(),
  image_url: z.string(),      // ← dulu imageUrl
  category_id: z.number(),    // ← dulu categoryId
  category_name: z.string(),
  harga: z.number(),
  stok: z.number(),
  rating: z.number(),
  review_count: z.number()    // ← dulu reviewCount
});

export const orderResourceShowSchema = z.object({
  id: z.number(),
  status: z.string(),
  total_harga: z.number(),    // ← dulu totalHarga
  invoice_number: z.string(),
  payment_status: z.string(),
  ...
  items: z.array(z.object({
    id: z.number(),
    produk_item_id: z.number(),
    produk: z.object({ id: z.number(), nama: z.string(), gambar: z.string(), image_url: z.string() }),  // ← dulu produkId/produkNama (flatten)
    qty: z.number(),
    harga: z.number(),
    subtotal: z.number()
  })),
  promotion: z.object({ code: z.string(), discount_minor: z.number() }),  // ← dulu promotionCode/promotionDiscountMinor
  shipping: z.object({ nama: z.string(), telepon: z.string(), alamat: z.string(), kota: z.string(), kode_pos: z.string() }),  // ← dulu shippingNama/dll
  created_at: z.string()      // ← dulu createdAt
});
```

### Rantai transformasi (untuk audit)
- **Sumber camelCase+flatten yang lama:** `flattenResourceFields()`
  (utils/resource-flattening.ts) — Satu-satunya titik transformasi nama
  field di jalur response. `ResponseSchemaMapper.ts:275` ("Convert to
  camelCase") hanya meng-camelCase-kan NAMA VARIABEL konstanta schema
  (`produkItemResourceShowSchema`), BUKAN nama field.
- **Tidak ada transformasi nama di:** `ContractGeneratorPass.convertSingleField`
  (pakai `fieldName` apa adanya), `ResponseSchemaMapper.buildObjectFromFields`
  (pakai `field.name` apa adanya), `ContractCodeBuilder`.
- **Jawaban "kamu ubah ya?":** Bukan perubahan sesi ini — flatten+camelCase
  sudah ada sejak awal (commit `9b941f2`/`132db5f`/`2eb068b`, refactor
  CompilerBridge memindahkan verbatim). Yang SESI INI ubah: menghapus
  flatten dari response contract + resolve nested resource (PR #5
  menyelesaikan z.unknown; fix ini menyelesaikan bentuk).
- **Dampak yang diperbaiki:** validator response (`validateXxxSchema`) kini
  `.parse()` payload backend asli (snake_case) tanpa gagal.

### Catatan: REQUEST side tidak pernah bermasalah
`parseValidationRulesPreserveNested` sejak awal memakai `originalName`
as-is (`provider_user_id`, `avatar_url`, `produk_item_id`) — snake_case
dipertahankan.

---

## 3. Keputusan yang dibutuhkan (sisa)

| # | Keputusan | Status |
|---|---|---|
| 1 | Bentuk response → snake_case + nested (original) | ✅ **Diputuskan & diimplementasikan** |
| 2 | PaymentResource & response non-GET (filter `r.method === 'GET'`) | ✅ **Diimplementasikan** |
| 3 | Rule `array` → `z.array(...)` di `FormFieldMapper` | ✅ **Diimplementasikan** |
| 4 | Nested `items.*` → elemen array schema (wildcard) | ✅ **Diimplementasikan** |
| 5 | Rule format array (JSON array, `profile.update.email`) | ✅ **Diimplementasikan** |

### Ringkasan implementasi (#2-5, semua di sesi ini)

- **(2)** `manifest-to-types.ts` — response dicari dari route method **apa pun**
  (prioritas GET dulu, lalu route lain). Set global `processedResponseResources`
  di luar loop group mencegah schema dobel saat response resource sama dipakai
  beberapa resource path (`POST /cart/items` → OrderResource, dan GET /orders →
  OrderResource). Hasil: `paymentResourceShowSchema` (POST /payment/{orderId} →
  PaymentResource, 16 field) kini muncul di output.
- **(3)** `FormFieldMapper.ts` case `'array'` → `ReadonlyCollectionType(ARRAY,
  PrimitiveType(STRING))`. Hasil: `payment.detail: z.array(z.string()).nullable().optional()`.
  Test unit lama yang mengasumsikan `array` → `string` diperbarui.
- **(4)** `parseValidationRulesPreserveNested` tidak lagi men-skip `.*` —
  wildcard dikumpulkan per parent (`items.*.produk_item_id`, `items.*.qty`),
  parent di-upgrade jadi `z.array(z.object({ produk_item_id, qty }))` (rebuild
  field karena `RequestField` readonly). Hasil: `checkout.create.items: z.array(z.object({ produk_item_id: z.string(), qty: z.number() })).optional()`.
- **(5)** `normalizeValidationRules()` mendukung rule string pipe **dan** array
  JSON (`['sometimes','required','email',{}]` — item non-string diabaikan).
  Hasil: `profile.update.email: z.string()` kini muncul (sebelumnya di-skip).

> Catatan: jalur **form** (`manifestToRequestTypes` → `parseValidationRules`)
> masih men-skip non-string & wildcard — itu di luar scope contract
> (`api-contract.ts`) dan tidak memengaruhi output contract.

---

## File yang terlibat

| File | Peran |
|---|---|
| `packages/cli/src/generators/utils/manifest-to-types.ts` | response semua method + dedupe (fix #2), konversi nested (fix bentuk), wildcard `.*` → elemen array (fix #4), dukung rule array JSON (fix #5) |
| `packages/cli/src/generators/utils/resource-flattening.ts` | flatten+camelCase — masih dipakai manifestToSemanticTypes (types.ts), TIDAK lagi di response contract |
| `packages/core/src/compiler/generators/contract-generation/ResponseSchemaMapper.ts` | camelCase nama variabel schema (bukan field) |
| `packages/core/src/compiler/generators/form-generation/FormFieldMapper.ts` | mapping rule `array` → `z.array(z.string())` (fix #3) |
| `packages/core/src/compiler/generators/form-generation/__tests__/FormFieldMapper.test.ts` | test `array` rule diperbarui ke `ReadonlyCollectionType` |
