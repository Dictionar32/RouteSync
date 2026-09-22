# Analisa TypeScript Errors — ResponseActionBuilder.test.ts

**Tanggal:** 2026-08-12
**Sumber:** Dump errors VS Code (extHost) — `packages/core/src/compiler/generators/contract-generation/__tests__/ResponseActionBuilder.test.ts`
**Jumlah error:** 14 (3× TS2554 + 11× TS2345)

---

## Ringkasan

Semua error di file ini adalah **satu akar masalah**: implementasi di
`packages/core/src/compiler/generators/contract-generation/` baru saja di-refactor
(perubahan dependency injection), tetapi **test belum di-update mengikuti
signature baru**. Tidak ada bug runtime — murni ketidakcocokan tipe.

Dua kelompok error:

| Kode | Jumlah | Penyebab |
|------|--------|----------|
| TS2554 (argumen count) | 3 | Constructor `NestedObjectSchemaBuilder`, `ArraySchemaBuilder`, `ResponseSchemaMapper` berubah jumlah parameter — test masih memanggil dengan pola lama |
| TS2345 (kind: string) | 11 | Object literal fields tanpa type annotation — property `kind` di-infer sebagai `string`, tidak assignable ke literal union `"object" \| "primitive" \| "array"` |

---

## Error 1 — TS2554: Signature constructor berubah

### Sebelum (pola yang dipakai test — LAMA)

```ts
// ResponseActionBuilder.test.ts (baris 30-43)
const primitiveRegistry = new PrimitiveTypeRegistry();
const zodModifierBuilder = new ZodModifierBuilder();

const nestedObjectBuilder = new NestedObjectSchemaBuilder(
    primitiveRegistry,          // arg 1
    zodModifierBuilder          // arg 2
);
const arraySchemaBuilder = new ArraySchemaBuilder(
    primitiveRegistry,          // arg 1
    nestedObjectBuilder,        // arg 2
    zodModifierBuilder          // arg 3
);
responseSchemaMapper = new ResponseSchemaMapper(
    nestedObjectBuilder,        // arg 1
    arraySchemaBuilder          // arg 2
);
```

### Sesudah (signature implementasi — BARU)

| Class | Constructor sekarang | Test panggil | Error |
|-------|---------------------|--------------|-------|
| `NestedObjectSchemaBuilder` | 1 param (`zodModifierBuilder`) | 2 arg | `Expected 1 arguments, but got 2` (line 34) |
| `ArraySchemaBuilder` | 2 param (`nestedObjectBuilder`, `zodModifierBuilder`) | 3 arg | `Expected 2 arguments, but got 3` (line 39) |
| `ResponseSchemaMapper` | **0 param** (self-contained — membuat dependensi sendiri di dalam constructor) | 2 arg | `Expected 0 arguments, but got 2` (line 43) |

### Perubahan desain di implementasi

1. `NestedObjectSchemaBuilder` **tidak lagi menerima** `primitiveRegistry` — cukup `zodModifierBuilder`.
2. `ArraySchemaBuilder` menerima `nestedObjectBuilder` + `zodModifierBuilder` (tanpa `primitiveRegistry`).
3. `ResponseSchemaMapper` menjadi **self-contained**: constructor tanpa argumen, membangun
   `ZodModifierBuilder`, `ResponseFieldParser`, dll sendiri di dalamnya
   (`ResponseSchemaMapper.ts: constructor() { const zodModifierBuilder = new ZodModifierBuilder() ... }`).

### Fix yang disarankan (test)

```ts
beforeEach(() => {
    const zodModifierBuilder = new ZodModifierBuilder();
    const nestedObjectBuilder = new NestedObjectSchemaBuilder(zodModifierBuilder);
    const arraySchemaBuilder = new ArraySchemaBuilder(nestedObjectBuilder, zodModifierBuilder);
    responseSchemaMapper = new ResponseSchemaMapper();   // ← self-contained
    builder = new ResponseActionBuilder(responseSchemaMapper);
});
```

---

## Error 2 — TS2345: `kind: string` tidak assignable ke literal union

### Penyebab

Semua fixture fields ditulis sebagai object literal tanpa type annotation:

```ts
const fields = [
    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
    //       ^^^^^^^^^^^^^^^^^^^^ TS infer: kind: string
];
const schema = builder.buildShowSchema('user', fields);
//                              ^^^^^^ TS2345: fields tidak assignable ke
//                                     ReadonlyArray<ParsedResponseField>
```

Karena `fields` adalah array literal biasa, TypeScript melebarkan (`widen`) tipe
property `kind` menjadi `string` — bukan literal `"primitive" | "object" | "array"`
yang dibutuhkan `ParsedResponseField`:

```ts
export interface ParsedResponseField {
    kind: 'primitive' | 'object' | 'array';   // ← literal union
    ...
}
```

### Fix yang disarankan (test)

Tambah type annotation (paling bersih — 1 baris per fixture):

```ts
import type { ParsedResponseField } from '../ResponseFieldParser';

const fields: ParsedResponseField[] = [
    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
    ...
];
```

Alternatif: `const fields = [...] satisfies ParsedResponseField[]` (TypeScript 4.9+)
atau `as const` pada masing-masing object (berisiko: membuat array `readonly`, tidak
cocok untuk parameter `ReadonlyArray` — annotation `: ParsedResponseField[]` lebih aman).

---

## Cakupan

Pola yang sama dipakai di **2 file test**:

| File | Status |
|------|--------|
| `ResponseActionBuilder.test.ts` | ❌ error (file ini) |
| `ResponseSchemaMapper.test.ts` | ✅ sudah konsisten — `new ResponseSchemaMapper()` (0 argumen) |

`ResponseSchemaMapper.test.ts` sudah di-update ke signature baru; hanya
`ResponseActionBuilder.test.ts` yang tertinggal. Pemakaian non-test
(mis. `ContractGeneratorPass`) membangun `ResponseSchemaMapper` sendiri — tidak
terpengaruh karena constructor-nya self-contained.

---

## Rekomendasi

1. **Update `ResponseActionBuilder.test.ts`** sesuai fix di atas (constructor + `: ParsedResponseField[]` pada semua fixture).
2. **Cek `ResponseSchemaMapper.test.ts`** — pola sama, update sekaligus.
3. **Jalankan full suite** setelah update; error TS di file lain (scan.ts/sync.ts/TypeScriptEmitter — ±106 error pre-existing di luar scope) tidak terkait.
4. Kalau mau, dokumen ini bisa dilampirkan ke PR perbaikan sebagai referensi.
