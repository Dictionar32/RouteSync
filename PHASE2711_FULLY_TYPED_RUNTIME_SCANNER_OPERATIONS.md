# Phase 2711 — Fully Typed Runtime Scanner Operations

## Ringkasan

Phase ini memperbaiki tiga titik sumber yang nyata pada jalur pembentukan manifest RouteSync:

1. Kontrak canonical identity upstream tidak lagi mengembalikan `boolean` untuk keputusan kesetaraan route/resource/request. Kontrak sekarang mengembalikan typed relation judgment ADT yang mempertahankan kedua operand.
2. Runtime PHP tokenizer dipindahkan dari `export function tokenizePhpSource(...)` ke `export const phpSourceTokenizer: PhpSourceTokenizerInterface = Object.freeze({ tokenize: ... })`.
3. Runtime PHP array parser dipindahkan dari `export function parsePhpArray(...)` ke `export const phpArrayParser: PhpArrayParserInterface = Object.freeze({ parse: ... })`.

Semua referensi package TypeScript terhadap nama callable lama `tokenizePhpSource` dan `parsePhpArray` sudah dimigrasikan ke operasi objek. Perubahan diterapkan pada source runtime, bukan hanya examples.

**Status: perbaikan sumber terukur, belum berarti seluruh repository sudah Fully Typed.** Audit menemukan banyak deklarasi `export function` lain yang masih berada di modul scanner aktif dan perlu dimigrasikan secara bertahap.

## Kontrak upstream yang diperbaiki

Berkas:

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts`

Operasi lama:

- `sameCanonicalRouteIdentity(...): boolean`
- `sameCanonicalResourceIdentity(...): boolean`
- `sameCanonicalRequestIdentity(...): boolean`

Diganti dengan:

- `relateCanonicalRouteIdentity(...): RequestTypeCanonicalRouteIdentityRelationJudgment`
- `relateCanonicalResourceIdentity(...): RequestTypeCanonicalResourceIdentityRelationJudgment`
- `relateCanonicalRequestIdentity(...): RequestTypeCanonicalRequestIdentityRelationJudgment`

Setiap judgment memiliki dua hasil tertutup: `*_identity_equivalent` atau `*_identity_distinct`, serta menyimpan `left` dan `right`. Keputusan tidak bergantung pada `semanticKey`; kunci serialisasi tetap menjadi proyeksi ledger, bukan otoritas kesetaraan.

Konsumen yang dimigrasikan:

- duplicate identity collision inventory;
- source-occurrence input membership dan identity correlation;
- candidate resource resolution;
- route/FormRequest resource identity mismatch.

Tidak dibuat helper equivalence baru pada level compiler. Operasi tetap dimiliki oleh `requestTypeDerivationSourceEvidenceInventory`, kontrak upstream yang sudah ada.

## Runtime scanner operation objects

Berkas:

- `packages/core/src/compiler/scanner/lexer/tokenizer.ts`
- `packages/core/src/compiler/scanner/lexer/arrayParser.ts`
- `packages/core/src/compiler/scanner/LaravelSourceLexer.ts`
- `packages/core/src/compiler/scanner/lexer/index.ts`
- `packages/core/src/index.ts`

Operasi baru:

```ts
export interface PhpSourceTokenizerInterface {
  readonly tokenize: (source: string) => readonly TokenDescriptor[];
}

export const phpSourceTokenizer: PhpSourceTokenizerInterface = Object.freeze({
  tokenize: (source: string): readonly TokenDescriptor[] =>
    scanClosure(createSourceStream(source), []),
});
```

```ts
export interface PhpArrayParserInterface {
  readonly parse: (
    source: string,
    tokens: readonly TokenDescriptor[],
    startIndex?: number,
  ) => ParsedPhpArrayResult;
}

export const phpArrayParser: PhpArrayParserInterface = Object.freeze({
  parse: (source, tokens, startIndex = 0) => {
    const opening = locateArrayOpening(tokens, startIndex);
    return relationOptionFold(
      opening,
      () => ({ entries: [], endIndex: startIndex }),
      index => parseArrayBody(source, tokens, index),
    );
  },
});
```

`LaravelSourceLexer` sekarang memanggil `phpSourceTokenizer.tokenize(...)` dan `phpArrayParser.parse(...)`. Public entrypoints mengekspor objek operasi, bukan callable function lama.

## Trace jalur upstream CLI → manifest

```text
packages/cli/src/commands/scan.ts / sync.ts
  → composition.manifestScanOperation.scan(input)
  → routeSyncCliUpstreamCompositionFactory.compose(...)
  → routeSyncCliManifestScanOperationFactory.create(manifestComposition)
  → controllerInvocationManifestCompositionAuthority.compose(input)
  → source-project identity + route source selection
  → source-document acquisition + controller-source discovery
  → scanner / LaravelSourceLexer
      → phpSourceTokenizer.tokenize(source)
      → phpArrayParser.parse(source, tokens, startIndex)
      → AST classification and declaration parsing
  → invocation inventory + semantic judgments
  → manifestBuilderOperationPreparation.prepare(receipt).build()
  → RequestType derivation input and source-evidence inventory
  → canonical route/resource/request identity relation judgments
  → collision inventory + resource resolution + source-occurrence verification
  → proof verifier / semantic authority
  → manifest_builder_complete atau manifest_builder_blocked
  → CLI projection only when upstream authority permits it
```

Trace utama berada pada `packages/cli/src/commands/scan.ts`, `packages/cli/src/upstreamCompositionFactory.ts`, `packages/cli/src/manifestScanOperationInterface.ts`, `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`, `packages/core/src/compiler/scanner/LaravelSourceLexer.ts`, dan `packages/core/src/compiler/semantic/request-type-derivation/`.

## Audit dan verifikasi

- Audit Phase 2711: **19/19** pemeriksaan statis lulus.
- Audit runtime interface Phase 2703: **9/9** pemeriksaan statis lulus.
- Syntax transpile: **27** berkas TypeScript yang berubah, **0** diagnostic sintaks.
- Runtime smoke: **6/6** lulus — kesetaraan identitas dengan semantic key berbeda; identitas berbeda dengan semantic key sama; operand relation dipertahankan; tokenizer menghasilkan EOF; array parser menghasilkan satu entry.
- Pemeriksaan TypeScript terpilih pada jalur RequestType: baseline Phase 2710 **79** diagnostic, Phase 2711 **79**; fingerprint diagnostic sama, **0 diagnostic baru**.
- Pemeriksaan TypeScript scanner tokenizer/parser: baseline **85** diagnostic, Phase 2711 **85**; fingerprint diagnostic sama, **0 diagnostic baru**. Diagnostic berasal dari modul lain pada dependency graph, terutama classifier/relational contracts, bukan file tokenizer atau array parser yang diubah.
- Full workspace typecheck tidak berhasil dijalankan dengan toolchain lokal: repository mensyaratkan TypeScript `ES2025` dan tipe `node`/`vitest`, sementara lingkungan ini hanya menyediakan TypeScript 5.8.3 dan tidak menyediakan dependency types tersebut. Ini bukan hasil typecheck yang sukses.
- Vitest dan CLI scan/sync end-to-end belum dijalankan.
- Kelengkapan seluruh 34 proof laws belum dibuktikan; `verification_incomplete` harus tetap fail-closed.

## Temuan yang masih terbuka

Pemindaian `packages/core/src/compiler/scanner` di luar test menunjukkan **168 deklarasi `export function` pada 69 file non-test** (baseline Phase 2710: 170 deklarasi). Dua entrypoint aktif sudah dimigrasikan di fase ini, tetapi pekerjaan penghapusan `export function` pada seluruh jalur scanner **belum selesai**.

Contoh modul aktif yang masih perlu audit interface-first dan migrasi operasi: `astClassifierRuntime.ts`, `controllerBodyParser.ts`, `controllerMethodParser.ts`, `controllerDeclarationParser.ts`, `modelDeclarationParser.ts`, `routeAst/*`, `resolvers/boundary/*`, serta operasi scanner lain. Jangan melakukan penggantian mekanis tanpa menelusuri pemilik kontrak, seluruh pemanggil, overload, dan hasil ADT.

Identitas occurrence masih menggunakan template-literal string untuk ledger/receipt, dan proof verifier masih memiliki pemeriksaan identity-key yang perlu diaudit. Fase ini tidak mengklaim seluruh identitas sudah struktural atau semua ADT `if`/`switch` sudah dihapus.

## Referensi TypeScript

- Object types dan interface contracts: https://www.typescriptlang.org/docs/handbook/2/objects.html
- Discriminated unions dan narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

## Kesimpulan

Phase 2711 memperbaiki kontrak upstream agar keputusan identitas berupa semantic judgment bertipe, serta memindahkan dua operasi scanner aktif ke pola `export const name: Interface = Object.freeze({ ... })`. Hasil ini nyata tetapi parsial; penghapusan semua deklarasi exported function, migrasi occurrence identity, full typecheck, Vitest, integrasi CLI, dan pembuktian lengkap tetap pekerjaan terbuka.
