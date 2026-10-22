# Phase 2708 — Fully Typed Runtime Scanner Operations / Source Identity Model

## Tujuan

Mengaudit jalur runtime pembentuk upstream CLI manifest dan memperbaiki satu keputusan identitas yang sebelumnya bergantung pada serialisasi `semanticKey`. Perubahan ini sengaja berupa operasi interface-typed, bukan generic wrapper dan bukan deklarasi `export function`.

## Trace jalur upstream CLI → manifest

```text
packages/cli/src/commands/scan.ts
  -> composition.manifestScanOperation.scan(input)
  -> packages/cli/src/manifestScanOperationInterface.ts
       routeSyncCliManifestScanOperationFactory.create(...)
  -> packages/cli/src/upstreamCompositionFactory.ts
       composition mengikat manifest composition + semantic pipeline
  -> packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts
       controllerInvocationManifestCompositionAuthority
  -> source-project identity canonicalization + route source selection
  -> controller/source discovery + source-document identity/read
  -> source invocation semantic inventory and judgment correspondence
  -> manifestBuilderOperationPreparation.prepare(receipt).build()
  -> Laravel source AST pipeline
  -> complete source model + dataflow judgments + resource-group capabilities
  -> manifest_builder_complete / manifest_builder_blocked
  -> CLI projects the completed manifest and runs request/resource preflight
```

Request/resource semantic subpath audited for this change:

```text
RequestTypeDerivationInput
  -> requestTypeDerivationSourceEvidenceInventory.inventory
  -> canonicalResourceIdentity(route resource)
  -> canonicalResourceIdentity(form-request resource)
  -> requestTypeCanonicalResourceIdentityEquivalence.equivalent
  -> requestTypeDerivationResourceResolution.resolve
  -> typed route/resource resolution receipt
  -> request-type source-occurrence verification / proof authority
  -> preflight judgment consumed at the CLI manifest boundary
```

## Perbaikan sumber yang diterapkan

Berkas baru:

`packages/core/src/compiler/semantic/request-type-derivation/requestTypeCanonicalResourceIdentityEquivalence.ts`

Operasi diekspos dalam bentuk:

```ts
export interface RequestTypeCanonicalResourceIdentityEquivalenceInterface {
  readonly equivalent: (
    left: RequestTypeCanonicalResourceIdentity,
    right: RequestTypeCanonicalResourceIdentity,
  ) => boolean;
}

export const requestTypeCanonicalResourceIdentityEquivalence:
  RequestTypeCanonicalResourceIdentityEquivalenceInterface = Object.freeze({
    equivalent: (left, right) =>
      left.canonicalName.value.value === right.canonicalName.value.value,
  });
```

`requestTypeDerivationResourceResolutionInventory.ts` sebelumnya membandingkan `routeResourceIdentity.semanticKey` dengan `bindingResourceIdentity.semanticKey`. Sekarang keputusan kesetaraan menggunakan operasi identitas domain yang menerima `RequestTypeCanonicalResourceIdentity`. Artinya, serialisasi bukti bukan lagi sumber kebenaran untuk keputusan kesetaraan resource pada jalur ini.

Regresi yang ditambahkan membuktikan dua arah:

- Identitas domain sama tetap setara walaupun representasi `semanticKey` berbeda.
- Identitas domain berbeda tetap tidak setara walaupun `semanticKey` sama.

## Hasil pemeriksaan

- `audit:phase2708-source-identity-model`: **7/7 PASS** (pemeriksaan source statis).
- `audit:phase2703-upstream-runtime-interface-operations`: **9/9 PASS** (pemeriksaan source statis yang sudah ada).
- TypeScript `transpileModule` syntax diagnostics untuk dua berkas implementasi dan tes baru: **0 diagnostics**.
- Uji runtime langsung terhadap operasi ekuivalensi hasil transpile: **2/2 PASS**.
- Percobaan `tsc --noEmit` pada dua berkas: **belum lulus** karena ada 80 diagnostic di workspace yang diimpor, termasuk error existing di `requestTypeDerivationResourceResolution.ts` dan berkas upstream lain; tidak ada diagnostic yang menunjuk ke dua berkas implementasi yang diubah setelah anotasi input eksplisit.
- Vitest belum dapat dijalankan: executable `vitest` dan `turbo` tidak tersedia di workspace (`npm test` berhenti pada `turbo: not found`). Jadi tes Vitest yang ditambahkan belum dianggap lulus.

## Batasan yang belum diselesaikan

Ini **bukan** klaim bahwa seluruh jalur sudah fully typed atau semua identitas string telah dihapus. Berikut masih perlu dibenahi pada fase berikutnya:

1. `semanticKey` masih menjadi string berserialisasi di model `RequestTypeCanonical*Identity` dan banyak konsumen verifier/inventory.
2. `RequestType*OccurrenceKey` masih berupa template-literal string yang disusun dari file/start/end.
3. Beberapa verifier dan pipeline request-type masih memiliki `if`/`switch` atas ADT.
4. `requestTypeDerivationProofVerifier` belum membuktikan seluruh canonical proof laws; status `verification_incomplete` tetap harus fail-closed.
5. Build, full typecheck, Vitest, dan CLI scan/sync end-to-end belum berhasil diverifikasi.
6. Audit export/function harus diterapkan ke seluruh graph runtime aktual, bukan disimpulkan dari satu direktori atau satu objek.

## Rekomendasi berikutnya

1. Ganti `semanticKey` sebagai identitas otoritatif dengan ADT identitas struktural (route/resource/request) dan operasi equality interface-typed; pertahankan string hanya sebagai output diagnostik/proyeksi jika memang dibutuhkan.
2. Ganti occurrence-key string dengan identitas sumber struktural `(source file, start, end)` dan equality operation yang konsisten; migrasikan verifier, collision inventory, dan receipt consumers bersama-sama.
3. Ubah sisa ADT dispatch pada jalur request-type menjadi operation objects berkontrak interface, tetapi jangan membungkus switch lama secara kosmetik.
4. Pulihkan dependencies agar full `tsc`, Vitest, build, dan scan/sync fixture dapat dijalankan.
5. Jangan mengklaim manifest complete/verified ketika proof verifier masih menghasilkan `verification_incomplete`.
