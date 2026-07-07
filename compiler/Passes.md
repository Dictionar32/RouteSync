# Passes and Pass Manager Specification

Middle-end RouteSync dikendalikan oleh **Pass Manager** yang mengatur daur hidup dan urutan optimasi IR.

## Antarmuka Kontrak Pass (Pass Contract)
Setiap pass wajib mendeklarasikan prakondisi (`requires`) dan pascakondisi (`produces`) secara eksplisit agar Pass Manager dapat memvalidasi urutan eksekusi secara otomatis sebelum kompilasi berjalan:

```typescript
export interface CompilerPass {
  name: string;
  requires: string[]; // Prasyarat kapabilitas graf (misal: ["AST", "SemanticGraph"])
  produces: string[]; // Hasil kapabilitas graf setelah pass selesai (misal: ["AggregateGraph"])
  run(context: CompilerContext): void;
}
```

## Siklus Jalur Kompilasi (Pass Pipeline)
Pass Manager mengeksekusi passes dalam urutan sebagai berikut:

1. **Semantic Resolution Pass**:
   * **requires**: `["AST"]`
   * **produces**: `["SemanticGraph"]`
   * **Fungsi**: Menganalisis relasi database Laravel dan mencocokkannya ke tingkat agregasi.
2. **Trait Composition Pass**:
   * **requires**: `["SemanticGraph"]`
   * **produces**: `["AggregateGraph"]`
   * **Fungsi**: Melakukan komposisi relasi Trait ke masing-masing Agregat.
   * **Aturan Komposisi Trait**:
     * Trait tidak boleh memiliki dependensi siklik antar-relasi.
     * Capability dengan simbol/nama yang sama pada agregat yang sama harus memicu kesalahan validasi (*validation error*) kecuali dideklarasikan sebagai override.
     * Agregat berhak meng-override kapabilitas dari trait tertentu secara eksplisit untuk menyesuaikan perilaku.
3. **Graph Optimization Pass**:
   * **requires**: `["AggregateGraph"]`
   * **produces**: `["OptimizedGraph"]`
   * **Fungsi**: Menyederhanakan graph, melumpuhkan node mati, dan memperkecil payload.
4. **Validation Pass**:
   * **requires**: `["OptimizedGraph"]`
   * **produces**: `["ValidatedGraph"]`
   * **Fungsi**: Memvalidasi kepatuhan spesifikasi kontrak dan mengisi sistem Diagnostik (*Diagnostics*).
5. **Serialization Pass**:
   * **requires**: `["ValidatedGraph"]`
   * **produces**: `["SerializedManifest"]`
   * **Fungsi**: Menulis grafik memori ke berkas `routesync.manifest.json` sebagai Compiler Intermediate Representation (IR). Berkas ini kemudian dibaca oleh generator backend (seperti `RuntimeContractGenerator` untuk menghasilkan `routesync.runtime.ts`).
