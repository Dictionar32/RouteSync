# Validation Layer Specification

Sebelum IR diserialisasi ke dalam media simpan, compiler menjalankan validator untuk memastikan tidak ada anomali graph.

## Aturan Validasi

Validation Pass bertanggung jawab untuk mengisi sistem Diagnostik (*Diagnostics*). Diagnostik dapat berupa kesalahan yang membatalkan build kompilasi atau hanya berupa peringatan informatif.

### Struktur Data Diagnostik

```typescript
export interface Diagnostic {
  severity: "error" | "warning";
  code: string;        // Pengenal kesalahan unik (misal: "E1001", "W2004")
  message: string;     // Deskripsi kesalahan manusiawi
  nodeId?: NodeId;     // Merujuk ke NodeId spesifik yang mengalami anomali
}
```

### 1. Tingkat Kesalahan (Errors - Menghentikan Kompilasi)
* **Missing Schema (E1001)**: Node operasi yang ditunjuk tidak memiliki referensi schema payload yang valid.
* **Orphaned Workflow Step (E1002)**: Langkah workflow merujuk ke `operationId` yang tidak terdaftar dalam graf.
* **Duplicate Capability (E1003)**: Dua nama kapabilitas yang sama dideklarasikan pada agregat yang sama.

### 2. Tingkat Peringatan (Warnings - Mengizinkan Kompilasi)
* **Unused Schema (W2001)**: Skema dideklarasikan namun tidak pernah dirujuk oleh operasi mana pun.
* **Aggregate Lacking Traits (W2002)**: Agregat dideklarasikan tanpa mengomposisi trait sama sekali.
