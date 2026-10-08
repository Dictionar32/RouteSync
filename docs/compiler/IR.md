# Intermediate Representation (IR) Specification

RouteSync IR dimodelkan sebagai **Typed Semantic Graph**. Representasi graf ini mendefinisikan seluruh node dan edge yang mewakili struktur aplikasi.

## Opaque Node ID Type
Untuk memastikan kebersihan tipe data, `NodeId` dideklarasikan sebagai opaque brand type:

```typescript
export type NodeId = string & {
  readonly brand: "NodeId";
};
```

## Graf Semantik Dasar
Setiap entitas dalam graf didefinisikan oleh Node dan Edge dengan tipe data (`kind` dan `relation`) masing-masing:

```typescript
export interface IRNode {
  id: NodeId;
  kind: "operation" | "aggregate" | "trait" | "workflow" | "schema" | "event" | "resource";
  displayName: string;
}

export interface IREdge {
  from: NodeId;
  to: NodeId;
  relation: "contains" | "implements" | "returns" | "calls" | "depends";
}
```

## Compiler Invariants
Untuk menjamin integritas data, Contract Graph wajib mematuhi empat aturan invariant berikut setelah eksekusi setiap Compiler Pass (tidak hanya setelah akhir kompilasi):

1. **Invariant 1 — Unique NodeId**: Seluruh node di dalam graf wajib memiliki `NodeId` yang unik secara global.
2. **Invariant 2 — No Dangling Edges**: Tidak boleh ada edge yang menggantung. Nilai `from` dan `to` pada setiap `IREdge` harus merujuk ke node yang terdaftar di dalam graf.
3. **Invariant 3 — Strict Operation Refs**: Semua properti berupa referensi operasi (`operationRef` / `operationId` / `operation`) wajib mengarah ke `OperationNode` yang valid.
4. **Invariant 4 — Continuous Validity**: Graf harus selalu dalam keadaan valid dan lulus pemeriksaan tipe data setelah setiap *Pass* selesai dijalankan.

## IR Versioning
Setiap manifest IR yang diserialisasi menyertakan properti versi untuk menjaga kompatibilitas API:

```json
{
  "compilerVersion": "2.0.0",
  "irVersion": "1.0.0",
  "schemaVersion": "1.0.0"
}
```
* **compilerVersion**: Versi rilis dari compiler CLI.
* **irVersion**: Versi spesifikasi struktur graf IR (misal: penambahan kind baru).
* **schemaVersion**: Versi spesifikasi format data validasi JSON Schema.
