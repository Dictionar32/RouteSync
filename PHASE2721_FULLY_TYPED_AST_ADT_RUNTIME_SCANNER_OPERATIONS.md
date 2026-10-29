# Phase 2721 — Fully Typed AST/ADT Runtime Scanner Operations

## Tujuan

Menerapkan pola interface-first pada builder runtime route-boundary yang benar-benar dipanggil dalam jalur produksi, bukan menambahkan contoh terpisah. Fokus perubahan ini adalah menghapus ekspor fungsi bebas untuk pembentukan kontrak route identity, binding, capability, dan provenance.

## Perubahan source

Lokasi pemilik semantic tetap `packages/core/src/compiler/semantic/route-boundary/`.

| Operasi | Interface | Object runtime |
|---|---|---|
| Identity contract | `RouteIdentityContractBuilderInterface` | `routeIdentityContractBuilder` |
| Binding contract | `RouteBindingContractBuilderInterface` | `routeBindingContractBuilder` |
| Capability contract | `RouteCapabilityContractBuilderInterface` | `routeCapabilityContractBuilder` |
| Provenance contract | `RouteProvenanceContractBuilderInterface` | `routeProvenanceContractBuilder` |

Keempatnya sekarang diekspos dengan pola:

```ts
export const routeIdentityContractBuilder: RouteIdentityContractBuilderInterface = Object.freeze({
  build: buildRouteIdentityContractImplementation,
});
```

Nama fungsi implementasi tetap internal. Pemanggil runtime diperbarui agar memakai `*.build(...)`. `boundaryContractFactory.ts` membentuk empat subkontrak lewat object operation tersebut, sedangkan `boundaryInputResolution.ts` memakai `routeProvenanceContractBuilder` untuk provenance. Ekspor lama `buildRouteIdentityContract`, `buildRouteBindingContract`, `buildRouteCapabilityContract`, dan `buildRouteProvenanceContract` dihapus dari API runtime barrel.

## Trace CLI → upstream manifest

```text
packages/cli/src/commands/scan.ts / sync.ts
  → composition.manifestScanOperation.scan(input)
  → routeSyncCliUpstreamCompositionFactory.compose(...)
  → controllerInvocationManifestCompositionAuthority.compose(input)
  → source-project identity canonicalization
  → controller source discovery
  → source-document read + identity binding
  → invocation semantic pipeline + delivery
  → invocation judgment authority
  → inventory authority.close(...)
  → closeInventory(...)
      ├─ validated receipt → manifestBuilderPreparation.prepare(...).build()
      └─ rejected inventory → controller_invocation_manifest_inventory_rejected
  → manifestBuilderOperationPreparation.prepare(...).build()
  → source AST pipeline
  → source model build
  → semantic dataflow + resource-group capability composition
  → manifest_builder_complete | manifest_builder_blocked
```

CLI composition dan manifest preparation sudah menggunakan interface-typed immutable operation objects. Perubahan fase ini menutup empat builder kontrak yang sebelumnya masih berupa exported free functions pada jalur semantic runtime. Status inventory rejected dan manifest blocked tetap merupakan ADT berbeda; tidak diubah menjadi boolean atau fallback sukses.

## Audit

Jalankan:

```bash
npm run audit:phase2721-route-boundary-interface-first-runtime
```

Hasil static audit: **17/17 pemeriksaan lulus**. Lihat `reports/PHASE2721_INTERFACE_FIRST_RUNTIME_AUDIT.json`.

Pemeriksaan mencakup typed object/interface pada keempat builder, tidak adanya ekspor free-function lama, pemanggil runtime yang memakai object builder, jalur CLI-to-manifest, pemeliharaan rejection ADT, dan larangan membuat ulang `relationFoundation`.

## Batasan yang masih terbuka

- `relationFoundation.ts` tidak dibuat kembali. Audit paket masih menemukan **37 deklarasi import** menuju modul yang dihapus. Itu belum dibereskan pada fase ini.
- Scanner belum wiring-only; sembilan direktori implementasi masih ada: `binders`, `descriptors`, `operations`, `orchestrator`, `resolvers`, `semantic`, `subscanners`, `symbols`, `upstream`.
- Typecheck penuh belum terverifikasi. Perintah global `tsc --noEmit --pretty false -p tsconfig.json` berhenti sebelum pemeriksaan proyek karena compiler/runtime environment tidak memiliki global type definitions (`node`, `vitest/globals`) dan versi compiler global tidak menerima konfigurasi `target`/`lib` proyek. Ini bukan bukti source typecheck lulus atau gagal pada toolchain proyek yang benar.
- Unit test dan CLI end-to-end belum dijalankan.

## Referensi TypeScript resmi

- Object types dan interface: https://www.typescriptlang.org/docs/handbook/2/objects.html
- Function types dan interface call signatures: https://www.typescriptlang.org/docs/handbook/interfaces.html
- Discriminated unions untuk mempertahankan varian hasil: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
