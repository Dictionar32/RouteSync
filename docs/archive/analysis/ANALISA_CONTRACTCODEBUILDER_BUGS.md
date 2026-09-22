# Analisa Bug — ContractCodeBuilder (Jalur A): `items: z.unknown()` & Validator Lowercase

**Tanggal:** 2026-08-12
**Status:** Analisa — belum ada fix
**Lingkup:** Jalur A (`generate`) — `contracts/api-contract.ts`

---

## Ringkasan

Dua cacat ditemukan di output `ContractCodeBuilder` (`contracts/api-contract.ts`):

| # | Gejala di output | Dampak |
|---|---|---|
| 1 | `items: z.unknown()` pada `orderResourceShowSchema` | Nested resource (array items) tidak tervalidasi — menerima apa pun |
| 2 | `validatecartCreate`, `validateregisterCreate` (lowercase) | Nama fungsi validator tidak konsisten dengan konvensi PascalCase |

---

## Bug 1 — `items: z.unknown()` (nested resource hilang)

### Gejala

```ts
export const orderResourceShowSchema = z.object({
  ...
  items: z.unknown(),          // ← seharusnya z.array(<OrderDetailResource schema>)
  promotionCode: z.string(),
  ...
})
```

Field `items` (yang sebenarnya `z.array(OrderDetailResource)` dari backend)
ter-resolve menjadi `z.unknown()` — validasi menerima bentuk apa pun.

### Root cause (rantai konversi)

```
① manifestToContractInput()          ← utils/manifest-to-types.ts
   responseData.fields: Record<string, SemanticType>
   └─ field 'items' (kind: resource di manifest)
      → flattenResourceFields()      ← utils/resource-flattening.ts:209-222
        → ReferenceType('App\Models', 'OrderDetailResource')
        (object resource TIDAK di-flatten ke dalam — tetap ReferenceType)

② ContractGeneratorPass.convertSingleField()   ← passes/ContractGeneratorPass.ts:363-377
   semanticType.kind === 'reference'
   → { kind: 'primitive', type: semanticType.name }   // 'OrderDetailResource'

③ ResponseSchemaMapper.buildPrimitiveSchema()  ← contract-generation/ResponseSchemaMapper.ts:287-295
   zodTypeMap = { string, number, boolean, datetime, unknown }
   'OrderDetailResource' TIDAK ada di map
   → return 'z.unknown()'          // ← FALLBACK
```

**Inti masalah:** `ReferenceType` dikonversi menjadi `kind: 'primitive'` dengan
`type` = nama referensi, dan mapper tidak mengenali nama itu → jatuh ke
`z.unknown()`. Referensi antar-resource tidak pernah dihubungkan.

### Opsi fix

| Opsi | Deskripsi | Trade-off |
|---|---|---|
| **A (disarankan)** | Di `convertSingleField`, `ReferenceType` → `kind: 'array'` jika koleksi? Tidak — info koleksi hilang. Lebih tepat: `kind: 'object'` dengan `type: '<ReferenceName>'` + mapper mengenali pola `*Resource` → referensi schema (`orderDetailResourceShowSchema`) | Perlu konvensi penamaan schema referensi; belum tentu schema itu ada di file yang sama |
| **B (minimal, aman)** | `ReferenceType` → `kind: 'primitive'`, `type: 'unknown'` DIPERTAHANKAN tapi **dokumentasikan** sebagai limitasi (mirip `API_CONTRACT_KNOWN_LIMITATIONS.md`) | Tidak memperbaiki, hanya eksplisit |
| **C (middle)** | `ReferenceType` → `kind: 'object'` dengan `fields: []` → menghasilkan `z.object({})` + warning | Schema tidak kosong lagi tapi masih bukan array items |
| **D (lengkap)** | Bawa info koleksi sampai ke mapper: konversi `ReferenceType` yang merujuk resource koleksi → `kind: 'array'` + `itemType` object; mapper generate `z.array(z.object({...}))` dari referensi resource di manifest | Butuh akses ke definisi resource (manifest) di mapper — perubahan lebih luas |

**Rekomendasi sementara:** Opsi B + catatan di dokumen arsitektur, ATAU Opsi A
jika schema referensi (`orderDetailResourceShowSchema`) dijamin ada di file
yang sama (saat ini hanya 2 resource yang punya response schemas —
`ProdukItemResource`, `OrderResource`).

---

## Bug 2 — Validator lowercase (`validatecartCreate`)

### Gejala

```ts
export const validatecartCreate = (data: unknown) => {
  return cartContractSchema.create.parse(data);
};
```

### Root cause

```ts
// ContractCodeBuilder.ts:412 (buildValidatorSection)
const functionName = `validate${resourceName}${this.capitalize(action.name)}`;
```

`resourceName` di sini adalah nama resource **lowercase** dari path
(`manifestToContractInput` → `sanitizeResourceName('cart')` → `'cart'`),
sehingga menghasilkan `validatecartCreate` — bukan `validateCartCreate`.

Pola yang sama juga dipakai di metadata pass
(`ContractGeneratorPass.ts:192-196`, `validatorName`).

### Opsi fix

| Opsi | Deskripsi |
|---|---|
| **A (disarankan)** | `validate${toPascalCase(resourceName)}${capitalize(action.name)}` → `validateCartCreate`, `validateRegisterCreate` — konsisten dengan `validateOrderResourceSchema` (PascalCase) |
| **B** | Biarkan lowercase demi konsistensi dengan nama schema (`cartContractSchema`) — nama fungsi tetap jelek |

**Rekomendasi:** Opsi A. Nama schema contract tetap lowercase
(`cartContractSchema` — desain yang sudah ada), hanya nama **fungsi validator**
yang di-PascalCase-kan. Perlu cek test yang menegaskan nama lama.

---

## File yang Terlibat (saat fix)

| File | Peran |
|---|---|
| `packages/core/src/compiler/passes/ContractGeneratorPass.ts` | `convertSingleField` (bug 1), `validatorName` metadata (bug 2) |
| `packages/core/src/compiler/generators/contract-generation/ResponseSchemaMapper.ts` | `buildPrimitiveSchema` fallback (bug 1) |
| `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts` | `buildValidatorSection` (bug 2) |
| `packages/core/src/compiler/generators/contract-generation/__tests__/ResponseActionBuilder.test.ts` | Test yang mungkin menegaskan nama validator |
| `packages/core/src/compiler/passes/__tests__/ContractGeneratorPass.test.ts` | Test pass |

## Test Plan (setelah fix)

1. Unit: `ContractGeneratorPass.test.ts` — field `items` (ReferenceType) tidak
   menghasilkan `z.unknown()` (sesuai opsi fix yang dipilih).
2. Unit: validator name = `validateCartCreate` (PascalCase) di output
   `buildContractFile`.
3. Regenerate jalur A (`generate` dengan manifest fresh6) → cek
   `contracts/api-contract.ts`:
   - `items` bukan `z.unknown()` lagi (atau terdokumentasi eksplisit)
   - `validateregisterCreate` → `validateRegisterCreate`, dst.
4. Full suite vitest.

---

## Keputusan yang Dibutuhkan

1. Bug 1: pilih opsi A / B / C / D untuk `ReferenceType` (rekomendasi: A atau B).
2. Bug 2: konfirmasi opsi A (PascalCase validator) — perubahan nama publik
   yang bisa memecah importer.
