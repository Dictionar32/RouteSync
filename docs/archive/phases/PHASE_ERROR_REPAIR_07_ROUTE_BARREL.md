# Phase Error Repair 07 — Route Barrel Boundary

## Root cause
`packages/core/src/types/route.ts` adalah compatibility facade aktif dengan sekitar 123 import-site. Facade tersebut secara eksplisit meminta ratusan domain symbols dari `./domain`, tetapi `packages/core/src/types/domain/index.ts` tidak mengekspos seluruh canonical modules.

## Repair
- Memetakan requested symbols dari `types/route.ts` ke canonical domain modules.
- Menambahkan explicit re-exports ke `types/domain/index.ts` untuk symbols yang memang memiliki canonical origin.
- Tidak menggunakan `export *` baru.
- Menghapus dua stale exports yang tidak memiliki canonical definition/consumer (`UnknownAstNode`, `normalizeCastType`).
- Tidak menghapus `types/route.ts`; compatibility facade tetap dipertahankan sementara.

## Verification
Targeted command:

```bash
npx tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext packages/core/src/types/route.ts
```

Result: tidak ada lagi diagnostic `Module './domain' has no exported member ...` dari `types/route.ts` / `domain/index.ts`.

Compile kemudian membuka diagnostics yang sebelumnya tertutup, terutama pada `packages/core/src/types/domain/contracts.ts` dan dependency semantic/resource contracts. Ini merupakan root berikutnya, bukan kegagalan Route Barrel boundary.

## Invariant

```text
canonical domain module
  -> explicit domain/index.ts boundary
  -> compatibility types/route.ts
  -> existing consumers
```

No wildcard export was added.

## Next root
Trace `domain/contracts.ts` sebagai producer/consumer contract boundary. Jangan menambal error satu per satu sebelum origin data (`ParsedRoute`, response descriptor, provenance, endpoint contract) dipetakan.
