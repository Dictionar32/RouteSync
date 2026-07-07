# IR Edge Specifications

Edge mendefinisikan hubungan antar node dalam graf semantik.

## Jenis Relasi Edge
Setiap relasi membatasi cara compiler melintasi (*traverse*) graf:

1. **`contains`**:
   * Digunakan oleh `AggregateNode` ke `TraitNode` atau `SchemaNode` ke `PropertyNode`.
2. **`implements`**:
   * Digunakan untuk mendefinisikan kapabilitas abstrak yang diimplementasikan oleh operasi nyata.
3. **`returns`**:
   * Digunakan dari `OperationNode` ke target `SchemaNode` respons.
4. **`calls`**:
   * Digunakan dari `WorkflowNode` untuk melacak urutan panggilan rute operasional.
5. **`depends`**:
   * Dependensi antarmodel atau data siklik.
