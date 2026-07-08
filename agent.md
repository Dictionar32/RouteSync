# RouteSync — Agent Log

> Log diskusi & temuan arsitektur, format changelog: entri terbaru di paling atas,
> entri lama di bawah. Setiap entri baru ditambahkan sebagai section baru di atas
> section sebelumnya — jangan menimpa entri lama.

---

## 2026-07-08 — Compiler Reframe: Findings & Open Items

Ringkasan diskusi tentang reframing RouteSync dari "route/frontend generator" menjadi
"source-to-source compiler" (Laravel → Next.js). Ditulis berdasarkan inspeksi langsung ke
kode di `packages/*` dan dokumen di `compiler/*`, bukan asumsi.

### Definisi Produk (disepakati)

> "A compiler that transforms Laravel applications into production-ready Next.js frontends
> by analyzing backend semantics and generating type-safe APIs, forms, validation, and
> data-fetching layers."

Versi Indonesia:

> "Compiler yang mengompilasi aplikasi Laravel menjadi aplikasi frontend Next.js yang
> type-safe, dengan runtime berbasis Axios, TanStack Query, React Hook Form, Zod, dan
> Hook Form Resolvers."

Poin penting: **Axios, TanStack Query, React Hook Form, Zod, Hook Form Resolvers bukan
target compiler — mereka adalah runtime yang dipilih.** Target compiler tetap "Next.js
Application". Konsekuensinya:

```
Compiler (tidak berubah)
├── Parser
├── Semantic Engine
├── Analyzer
└── IR (Manifest)

Emitter (yang berubah kalau ganti runtime)
├── Next.js Emitter
│   ├── Axios Runtime
│   ├── TanStack Query Runtime
│   ├── React Hook Form Runtime
│   └── Zod Runtime
├── React Native Emitter (future)
├── Vue Emitter (future)
└── Svelte Emitter (future)
```

### Visi ini SUDAH ada di repo, tapi implementasinya belum konsisten

Folder `compiler/` di root sudah berisi 27 dokumen arsitektur: `Constitution.md`, `IR.md`,
`Passes.md`, `Optimizer.md`, `PluginAPI.md`, `CompilerArchitectureAudit.md`, dll.
Konstitusinya sudah eksplisit menyatakan:

> "Generator tidak boleh melakukan inferensi semantik. Semua inferensi, resolusi, dan
> optimasi harus selesai di Middle-end. Backend generator hanya boleh membaca IR dan
> menghasilkan artefak target."

Masalahnya: dokumentasi ini sebagian bersifat **aspirasional**, sementara kode aktual belum
sepenuhnya mematuhinya. Berikut temuan konkret dari inspeksi kode.

### Temuan #1 — `IntentResolver` masih melanggar konstitusinya sendiri

`compiler/CompilerArchitectureAudit.md` (judul: *"Generator Semantic Leakage"*) berstatus
**"Completed Refactor"**, mengklaim `HookGenerator.ts` sudah 100% dumb emitter setelah
logikanya dipindah ke `packages/cli/src/resolvers/IntentResolver.ts`.

Kenyataan di kode (`packages/cli/src/resolvers/IntentResolver.ts`):

```ts
let qtyField = 'qty'   // fallback masih hardcoded
...
return nameLower === 'qty' || nameLower === 'quantity' || nameLower === 'jumlah' || nameLower === 'count'
```

Ini masih **string-matching manual** terhadap nama kolom, bukan derivasi deterministik dari
`route.raw.schema.rules` via `toIdentifier` (rencana yang sedang dikerjakan). Artinya
`IntentResolver` sendiri masih melakukan bentuk inferensi semantik heuristik — audit
dokumennya perlu dianggap "in progress", bukan selesai, sampai fallback ini dihapus.

**Action item:** ganti heuristik nama field di `IntentResolver` dengan derivasi asli dari
`schema.rules` pada `ParsedRoute`, sehingga tidak ada lagi daftar kata kunci hardcoded
(`qty`/`quantity`/`jumlah`/`count`) atau default `'qty'`.

### Temuan #2 — CLI belum mencerminkan framing compiler

`packages/cli/src/index.ts`:

```ts
program
  .name('routesync')
  .description('Laravel routes to typed frontend SDKs')  // framing generator lama
```

Command yang tersedia: `scan`, `generate`, `sync`, `watch`, `annotate`, `explain`, `audit`.
Tidak ada `build` — padahal contoh di diskusi sebelumnya memakai `routesync build` sebagai
entry point compiler pipeline (parse → resolve → analyze → optimize → emit).

**Action item (opsional, prioritas rendah):** pertimbangkan rename/alias command dan
description agar konsisten dengan framing compiler, setelah struktur inti stabil.

### Temuan #3 — Pemisahan Compiler/Runtime sudah benar di layer Hooks, belum di layer Zod

**Sudah sesuai visi: `HookGenerator` → `packages/react`**

`HookGenerator.ts` (bagian compiler, di `packages/cli`) **tidak pernah** menyentuh TanStack
Query secara langsung. Ia hanya emit:

```ts
import { defineHooks, useAggregateCollectionIntent } from 'routesync/react'
```

Baru di `packages/react/src/hooks/defineHooks.ts` (paket runtime, bukan compiler) muncul:

```ts
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
```

Ini persis pola yang diinginkan: compiler tidak tahu apa-apa soal TanStack Query, ia hanya
tahu "ada intent hook bernama X". `packages/react` berperan sebagai **Next.js Emitter
runtime**. Kalau besok ingin ganti ke SWR, yang berubah cukup `packages/react` (atau
package runtime baru), bukan `HookGenerator`.

**Belum sesuai visi: `ZodTierGenerator`**

`ZodTierGenerator.ts` juga berada di `packages/cli` (bagian compiler), tapi ia emit kode
Zod secara **literal langsung** di generator itu sendiri:

```ts
lines.push(`import { z } from 'zod'`)
...
if (expr.type === 'number') return 'z.number()'
if (expr.type === 'boolean') return 'z.boolean()'
```

Tidak ada abstraksi runtime perantara (semacam `routesync/validation`). Logika "bagaimana
AST expression dipetakan ke validator" menyatu langsung dengan syntax Zod, bukan diserahkan
ke IR netral yang baru di-emit oleh backend Zod-spesifik.

**Kesimpulan gap:** layer validasi (Zod) masih di level *"compiler tahu targetnya Zod"*,
sedangkan layer hooks (TanStack) sudah di level *"compiler tidak tahu targetnya apa"*.
Kalau mau swap Zod → Valibot semudah swap TanStack → SWR, `ZodTierGenerator` perlu
direfactor mengikuti pola yang sama seperti `HookGenerator`/`packages/react`.

**Action item:** pisahkan `ZodTierGenerator` menjadi IR-neutral schema description, lalu
emit ke package runtime terpisah (misal `packages/zod-runtime` atau ekspor dari
`@routesync/sdk`), sama seperti pola hooks.

### Ringkasan Open Items (urutan prioritas yang didiskusikan)

1. **`IntentResolver` / `schema.rules`** — hapus heuristik nama field hardcoded, ganti
   dengan derivasi dinamis dari `ParsedRoute.raw.schema.rules` + `toIdentifier`. *(sedang
   dikerjakan sebelum diskusi ini)*
2. **`ZodTierGenerator` refactor** — pisahkan emisi Zod dari compiler ke runtime adapter,
   mengikuti pola `HookGenerator` → `packages/react`.
3. **CLI naming/description** — selaraskan dengan framing compiler (`build` command,
   description baru), prioritas rendah, dikerjakan setelah struktur inti stabil.
4. **Reorganisasi folder** (opsional, besar) — dari `packages/cli/src/{parsers,resolvers,
   generators}` menjadi struktur `compiler/{parser,semantic,analysis,optimizer,emitter,cli}`
   seperti yang digambarkan di diskusi awal. Disarankan dikerjakan **setelah** item 1–2
   selesai agar tidak memindah kode yang masih berubah.
