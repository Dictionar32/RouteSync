# Phase 2729 — Semantic Query Ownership Migration

## Tujuan

Memindahkan implementasi semantic query evidence keluar dari `compiler/scanner`, mengubah relation bridge menjadi API operasi bertipe interface-first, dan mempertahankan jalur CLI upstream manifest serta ADT hasilnya.

## Perubahan sumber

1. Dipindahkan:
   - `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`
   - menjadi `packages/core/src/compiler/semantic/query/queryEvidenceProducer.ts`
2. Dipindahkan:
   - `packages/core/src/compiler/scanner/semantic/semanticEvidenceRelations.ts`
   - menjadi `packages/core/src/compiler/semantic/semanticEvidenceRelations.ts`
3. Implementasi bridge (`astValue`, `astTokens`, `phpBlock`, `query`, `fold`, `project`) sekarang private dan dipublikasikan melalui:

   ```ts
   export interface SemanticEvidenceRelationsInterface {
     readonly astValue: (raw: string) => Presence<SemanticEvidence<PhpAstValue>>;
     readonly astTokens: (tokens: readonly TokenDescriptor[]) => Presence<SemanticEvidence<PhpAstValue>>;
     readonly phpBlock: (tokens: readonly TokenDescriptor[]) => Presence<SemanticEvidence<PhpBlock>>;
     readonly query: (input: QueryProducerInput) => Presence<readonly QueryAst[]>;
     readonly fold: <T, R>(
       value: Presence<SemanticEvidence<T>>,
       onAbsent: () => R,
       onPresent: (entry: T) => R,
     ) => R;
     readonly project: <T, R>(values: readonly T[], project: (value: T) => R) => readonly R[];
   }

   export const semanticEvidenceRelations: SemanticEvidenceRelationsInterface = Object.freeze({
     astValue: astValueRelationImplementation,
     astTokens: astTokenRelationImplementation,
     phpBlock: phpBlockRelationImplementation,
     query: queryRelationImplementation,
     fold: semanticEvidenceFoldImplementation,
     project: evidenceProjectImplementation,
   });
   ```
4. `queryEvidenceProducer` tetap memiliki kontrak `QueryProducer` dan sekarang diekspos sebagai `Object.freeze(...)`.
5. `compiler/scanner/subscanners/queryProducer.ts` tetap menjadi facade wiring dan memanggil `semanticEvidenceRelations.query(...)` lalu `semanticEvidenceRelations.fold(...)`.
6. Tidak ada `relationFoundation` baru, wrapper foundation, atau fallback boolean yang dibuat.

## Trace runtime yang dipertahankan

```text
CLI scan / sync
  → manifestScanOperation.scan(input)
  → controller invocation manifest composition
  → canonical project identity / route selection / controller discovery
  → source-document identity binding
  → invocation semantic judgments
  → inventory validation / receipt closure
  → manifest builder
  → manifest_builder_complete | manifest_builder_blocked
  → request/resource resolution preflight
  → RequestType semantic projection
  → manifest projection
  → manifest_projected | manifest_projection_blocked
```

Query producer migration berada pada jalur semantic query evidence dan tidak menggantikan manifest authority atau mengubah ADT manifest menjadi hasil kosong.

## Verifikasi

- `npm run audit:phase2729-semantic-query-ownership`: **10/10 pemeriksaan statis lulus**.
- Relative imports untuk tiga file yang berubah: lulus pemeriksaan resolusi statis.
- `package.json` parse: lulus.
- `relationFoundation`: file foundation tetap tidak ada; 37 referensi masih tersebar di 28 file TypeScript.
- `tsc --noEmit -p tsconfig.json`: **gagal diverifikasi** pada lingkungan ini karena tipe global/`@types/node`/`vitest/globals` tidak tersedia dan TypeScript global yang terpasang tidak menerima target/lib konfigurasi proyek. Ini bukan bukti bahwa source migration lulus typecheck; full typecheck, unit tests, build, dan CLI E2E masih terbuka.

## Audit runtime manifest

Audit ini memverifikasi bahwa `packages/cli/src/commands/scan.ts` dan `sync.ts` tetap menggunakan `manifestScanOperation.scan(...)`, serta `manifestBuilderInterface.ts` masih memuat `manifest_builder_complete` dan `manifest_builder_blocked`. Audit statis ini bukan pengganti CLI end-to-end.

### Regression audit reruns

- Phase 2727 resolver graph runtime operations: **8/8 lulus**.
- Phase 2728 controller variable runtime binding: **9/9 lulus**.
- Phase 2726 semantic mapping runtime ownership: **11/11 lulus**.
