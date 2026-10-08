# Backend Generator Contract

Backend bertindak sebagai penerjemah murni yang mengonsumsi IR yang bersih dari Middle-end.

## Aturan Konstitusi Backend
1. **Dilarang keras melakukan inferensi semantik**. Backend tidak boleh berasumsi tentang relasi model database.
2. **Fokus pada Kode Output**: Menghasilkan wrapper tipis (seperti React Query hooks, Vue Ref/Composables, atau Zod schema validation) murni dari relasi capability yang telah terselesaikan di IR.
