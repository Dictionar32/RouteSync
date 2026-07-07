# Optimizer Specification

Spesifikasi optimasi yang dijalankan pada Middle-end.

## 1. Dead Node Elimination (DNE)
Setiap `OperationNode` yang terdaftar pada AST tetapi tidak pernah dirujuk oleh Trait, Workflow, atau tidak diakses melalui rute API klien akan dipangkas dari Contract Graph sebelum kompilasi backend.

## 2. Schema Merging & Deduping
Jika terdapat beberapa skema payload request yang secara struktural identik (misal: Schema A dan Schema B memiliki struktur kunci dan tipe data yang sama), Optimizer akan menggabungkannya menjadi satu node `SchemaNode` tunggal untuk menghindari redudansi deklarasi Zod pada backend generator.
