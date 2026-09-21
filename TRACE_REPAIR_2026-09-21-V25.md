# RouteSync Trace / Suggestion / Repair — v25

## Tujuan
Menaikkan tool trace dari pattern audit sederhana menjadi proof-oriented audit untuk alur:

`Laravel ecommerce-shop -> PHP AST/ADT -> high-level upstream model -> SourceAsts -> manifest`

Legacy manifest tidak digunakan sebagai evidence.

## Peningkatan tool

1. **Fail-closed AST construction proof**
   - Tidak mempercayai deklarasi `Promise<...Ast[]>` saja.
   - Mencari konstruksi literal `kind: ..._ast` pada producer scanner.
   - `RouteAst` yang hanya diklaim oleh tipe tetapi tidak dikonstruksi ditandai critical.

2. **Hidden rescan detection**
   - Tidak hanya memeriksa `pipelineScanner.ts`.
   - Memeriksa `sourceAstScanner.ts` apakah kategori yang sudah memakai `scanAsts` kembali memakai `scan`.
   - Ini menemukan hidden double interpretation pada FormRequest dan Controller di checkpoint.

3. **Pipeline rescan detection**
   - Memeriksa `projectRoot` scanner calls setelah `scanSourceAsts`.
   - Semua rescan dianggap critical sampai field lineage membuktikan redundansi.

4. **Source category coverage**
   - Membandingkan vocabulary kategori yang diharapkan dengan `SourceAsts`.
   - `channels` yang belum ada di checkpoint terdeteksi.

5. **Semantic projection audit**
   - Memeriksa apakah AST hanya membawa projection rendah ketika upstream membutuhkan model tinggi.
   - Tidak membuat interface baru; repair diarahkan ke existing high-level model.

6. **Free-data/fallback classification**
   - `Record` pada semantic boundary = high.
   - `Map` = review, bukan otomatis data loss.
   - `?.` parser-internal = review, bukan otomatis data loss.
   - `??` yang benar-benar mengisi semantic value = high.
   - Tool tidak lagi menghukum semua optional access secara buta.

7. **Completeness fail-closed audit**
   - Mendeteksi risiko `discovered_empty` diterima sebagai bukti complete tanpa semantic verification.

8. **Source-boundary vocabulary audit**
   - Memastikan seluruh kategori SourceAsts, termasuk channel, memiliki jalur boundary yang konsisten.

## Hasil terhadap checkpoint

- Laravel PHP files: **111**
- Status: **REPAIR_REQUIRED**
- Critical: **10**
- High: **7**
- Hidden rescans: **2**
- Pipeline rescans: **6**
- Semantic free-data/fallback findings: **3**

Critical utama:

- `channels` missing from SourceAsts
- hidden FormRequest rescan
- hidden Controller rescan
- pipeline Model/FormRequest/Controller/Resource/Route/Channel rescans
- `RouteAst` ADT construction belum terbukti

High utama:

- RequestAst masih projection `RequestDefinition`, belum membawa authoritative `FormRequestSource`
- ResourceAst masih projection `ResourceDefinition`, belum membawa authoritative `ParsedResource`
- RouteAst masih projection `RouteDefinition`, belum membawa authoritative `ParsedRoute`
- dua `Record` semantic boundaries
- `rawTypeConverter` masih mempunyai semantic `??` fallback
- channel belum masuk source boundary vocabulary

## Prinsip repair

Tool **tidak** menyarankan cast sebagai perbaikan.

Jika data downstream belum tersedia:

`trace -> identify first loss -> strengthen existing upstream model -> construct ADT -> consume ADT -> re-trace`

Bukan:

`missing data -> ?/??/fallback/cast -> continue`

## File

- Tool: `tools/trace-data-loss-v25.cjs`
- Report: `data-loss-trace-v25.json`
