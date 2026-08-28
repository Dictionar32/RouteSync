# RouteSync — Agent Rules & Project Context

Workspace-scoped rules for AI agents working on this repository.

---

## Project Overview

**RouteSync** adalah CLI tool yang melakukan static analysis terhadap project Laravel PHP dan men-generate TypeScript Zod schema + React Query hooks secara otomatis. Pipeline utamanya:

```
Laravel routes/api.php
  └─► LaravelRouteParser (PHP subprocess)
        └─► routesync.manifest.json
              └─► SemanticKernelV2 (TypeScript)
                    ├─► ZodTierGenerator  → api-contract.ts / api-schema.ts
                    └─► HookGenerator     → hooks.ts / sdk.ts
```

### Package Layout

| Package | Path | Deskripsi |
|---|---|---|
| `@routesync/cli` | `packages/cli/` | Scanner PHP, generators, `scan`/`generate`/`sync` commands |
| `@routesync/core` | `packages/core/` | Semantic kernel, resolvers, types |
| `@routesync/sdk` | `packages/sdk/` | Tests, shared utilities |

---

## Rules untuk Agent

### 1. Test Wajib Lulus Sebelum Selesai
Selalu jalankan test suite sebelum mengakhiri sesi:
```bash
cd packages/sdk && npx vitest run --reporter=verbose
```
Target: **semua test lulus**. Jangan tinggalkan test yang failing.

### 2. Setiap Bug Fix → Regression Test
Setiap kali memperbaiki bug, **wajib tambahkan** regression test di `packages/sdk/tests/`. Nama file test harus mencerminkan komponen yang ditest (contoh: `laravelParserAssignments.spec.ts` untuk fix di `LaravelRouteParser`).

### 3. Setiap Issue → Tulis ke KNOWN_ISSUES.md
Format per entry (append, newest first, sebelum issue sebelumnya):
```
### Issue N: <judul singkat>
**Symptom** → ...
**Where** → file path — deskripsi lokasi spesifik
**Root cause** → ...
**Fix** → ...
**Regression test** → <test file> › <test name>
**Status** → Diagnosed & Fixed | Known Limitation | By Design
```

### 4. Setiap Fix → Tambahkan ke CHANGELOG.md
Tambahkan entry di bagian `### Fixed` dalam `## [Unreleased]`. Sertakan referensi `(Issue #N)`.

### 5. Jangan Ubah File PHP yang Di-generate
File `routesync.manifest.json` dan `api-contract.ts`/`api-schema.ts` di project toko-online adalah **output** — jangan diedit langsung. Perbaiki source generator-nya.

### 6. `String.raw` untuk PHP Templates
Semua PHP code block di dalam `LaravelRouteParser.ts` **harus** menggunakan `String.raw\`...\`` agar backslash tidak di-escape JS. Jangan embed PHP langsung di template literal biasa.

### 7. Build Setelah Ubah `packages/core` atau `packages/cli`
`packages/sdk/tests` mengkonsumsi dari `dist/`. Setelah mengubah source core/cli, jalankan:
```bash
npm run build
```
sebelum menjalankan test.

### 8. Flow-Based Structured Code Refactoring Workflow
Saat merapikan/refactor pass atau modul compiler di RouteSync menjadi Structured TypeScript, **wajib** mengikuti 8 langkah eksplisit:
1. **Trace actual flow & origin boundary**: Jika downstream code masih defensif (`?.`, `??`, `Array.isArray`), trace 1 tingkat ke atas untuk memindahkan resolusi/komposisi ke **Origin Boundary** agar downstream pass menerima *Complete Contract* yang 100% utuh.
2. **Tentukan type family** yang benar-benar muncul dari flow (hindari wrapper buatan yang tidak memberi nilai semantic).
3. **Buat TTD (Type Vocabulary Design) kecil** khusus boundary tersebut tanpa over-engineering struktur folder.
4. **Buat type contract test** untuk `extends` / `implements` / `composition`.
5. **Buat flow test & origin test** untuk jalur data per-stage dan keutuhan dependensi.
6. **Baru refactor implementation** (ubah method `run()` / entry point menjadi *flow declaration* murni).
7. **Jalankan seluruh regression test** yang sudah ada (wajib 100% GREEN).
8. **Bandingkan output sebelum vs sesudah** (pastikan determinisme dan eksaktitas output).

*Catatan*: Test-plan yang ditulis tidak boleh dibuang atau diganti — itu menjadi *baseline behavioral map* untuk refactoring.

---

## Pola Bug yang Sering Muncul

### Pattern A: `z.unknown()` pada field yang seharusnya typed
**Kemungkinan penyebab (cek berurutan):**
1. Method Eloquent tidak ada di Level 90/80 regex → tambahkan ke alternation di `LaravelRouteParser.ts`
2. Variabel plural tidak bisa di-resolve ke model → cek `VariableResolver.ts` heuristic
3. Accessor di model tidak ter-resolve → cek `AccessorResolver.ts` early-return guard
4. Kolom `nullable: true` tapi bukan dari `?->` → cek `ExpressionResolver.ts` nullsafe handler
5. Assignment di dalam closure discarded → cek `assignmentsScannerPhp` skip guard

### Pattern B: Schema field wrapped/unwrapped salah
**Kemungkinan penyebab:**
1. `JsonResource` pakai default `$wrap = 'data'` → cek `wrapDetectionPhp` di `LaravelRouteParser.ts`
2. `use X as Y` alias tidak ter-resolve → cek regex alias di wrap detection block

### Pattern C: Test PHP integration gagal
**Kemungkinan penyebab:**
1. Build belum dijalankan setelah ubah source → `npm run build`
2. Backslash escape salah di PHP template → pakai `String.raw`

---

## Known Issues Ringkasan

| # | Judul | Status |
|---|---|---|
| 17 | Assignment scanner skip closure-return false positive | ✅ Fixed |
| 16 | `updateOrCreate` tidak tracked di Level 90 | ✅ Fixed |
| 15 | `?->` tidak menghasilkan nullable | ✅ Fixed |
| 14 | Ternary branch `null` tidak nullable | ✅ Fixed |
| 13 | `use X as Y` alias tidak resolve di wrap detection | ✅ Fixed |
| 12 | Indented `use` statement tidak match | ✅ Fixed |
| 11 | Hardcoded `App\Http\Resources\` namespace | ✅ Fixed |
| 10 | TS→PHP template escaping syntax error | ✅ Fixed |
| 9 | JSON member access chain — runtime typing | ⚠ Partial (by design) |
| 8 | JSON/array cast `unknown` on property access | ⚠ Known Limitation |
| 7 | Chained access through nonexistent relation | ✅ By Design |
| 6 | snake_case → camelCase accessor mismatch | ✅ Fixed |
| 5 | AccessorResolver treated resolved result as raw AST | ✅ Fixed |
| 4 | Kernel model graph stale after accessor resolution | ✅ Fixed |
| 3 | Route parameter type mismatch (undefined vs number) | ✅ Fixed |
| 2 | Request payload form type mismatch (number vs string) | ✅ Fixed |
| 1 | DB connection refused in Docker | ✅ Workaround |

Detail lengkap → [`KNOWN_ISSUES.md`](../KNOWN_ISSUES.md)
