# PRD: ROUTESYNC GENERATOR ARCHITECTURE REFACTOR

**Document Version:** 1.0  
**Status:** Draft  
**Date:** July 2026  
**Scope:** Frontend Code Generator Pipeline (packages/cli/src/generators/)

---

## EXECUTIVE SUMMARY

RouteSync's code generator pipeline memiliki masalah arsitektur fundamental yang menyebabkan:
- **Duplikasi logic** di 6+ tempat (ACTION_MAP, resource resolution, type inference)
- **Silent bugs** (keputusan yang sama dihitung independen, bisa diverge tanpa warning)
- **Maintenance burden** tinggi (perubahan logic harus di-update manual di multiple places)
- **Zero incremental compilation** (setiap sync adalah full rebuild)

**Root Cause:** Compiler IR (Intermediate Representation) ada tapi tidak digunakan. Generator re-infer keputusan dari nol daripada membaca keputusan final dari IR.

**Solution:** Expand IR scope, export ke semua generator, jadikan single source of truth.

---

## PROBLEM STATEMENT

### P1: God Object (ZodTierGenerator) — KRITIS

**Current State:**
- File tunggal 1890 baris, 83KB
- 6 tanggung jawab terpisah (contract, schema, field, read, form, mapper)
- 1 class-level mutable state (`knownSchemas`, class-static)

**Impact:**
- Sulit di-debug (method saling depend, state sharing implisit)
- Sulit di-test (perlu setup `knownSchemas` manual, temporal coupling)
- Sulit di-maintain (6 tanggung jawab dalam 1 file)
- Sulit di-extend (tambah fitur berarti edit 1890-line file)

**Evidence:**
- Line count: 1890 (ZodTierGenerator vs 400 HookGenerator, 400 SDKGenerator)
- Method count: 6 public generate* methods + ~15 private helper methods
- State: `knownSchemas` (mutable class-static), `graph` (dead field), `routeResponseMap` (lokal)

---

### P2: Duplicate ACTION_MAP — KRITIS

**Current State:**
- CRUD action mapping (`post→Create`, `put→Update`, etc) di-define **6 kali**
- 6 lokasi berbeda: `ZodTierGenerator` (4x), `HookGenerator` (1x), `SDKGenerator` (1x)
- Isi identik, nama variabel berbeda, maintai di tempat terpisah

**Impact:**
- Kalau format berubah (`post→Build`), harus update 6 tempat
- Risk: 1-2 tempat terlupa update → silent inconsistency
- Tidak ada compiler check atau test yang memaksa konsistensi

**Evidence:**
```
ZodTierGenerator: CONTRACT_ACTION_MAP, SCHEMA_ACTION_MAP, 
                  ACTION_IN_CRUD, MAPPER_ACTION_MAP (4 literal)
HookGenerator: ACTION_TO_CRUD_HOOK (1 literal)
SDKGenerator: SDK_ACTION_MAP (1 literal)
Total: 6 duplikasi identik
```

---

### P3: Resource/Model Resolution — 3-4 Implementasi Independen — KRITIS

**Current State:**
- Keputusan "response ini Resource yang ada, atau fallback ke Model?" dihitung **3-4 kali independen**
- Lokasi: `ZodTierGenerator.generateContract()` (logic `isResourceAlias`)
- Lokasi: `HookGenerator.resolveBaseResponseName()` (logic berbeda tapi tujuan sama)
- Lokasi: `HookGenerator.resolveResponseInfo()` (implementasi ketiga)
- Lokasi: `SDKGenerator.getResponseInfo()` (implementasi keempat)

**Impact:**
- Bisa silent diverge: logic di lokasi 1 update, lokasi 2-4 lupa
- Ini adalah root cause dari bug sebelumnya (`OrdersGetResponseSchema = OrderResourceSchema`)
- Pattern terverifikasi: bukan satu bug, tapi systematic pattern

**Evidence:**
- `ZodTierGenerator` line 376-379: `isResourceAlias` logic
- `HookGenerator` line 15-40: `resolveBaseResponseName()` logic
- `HookGenerator` line 68+: `resolveResponseInfo()` logic berbeda
- `SDKGenerator` line 38+: `getResponseInfo()` logic ketiga
- Semuanya membaca field yang sama (`meta.kind`, `meta.resource`, `meta.model`) tapi logic berbeda

---

### P4: Type Inference — Sistem Paralel Zod vs TS — TINGGI

**Current State:**
- 2 sistem tipe parallel yang identik strukturnya, independent:
  - `buildResponseZodType()` → untuk Zod schemas (z.number(), z.string(), dst)
  - `mapSqlTypeToTs()` → untuk TS types (number, string, dst)
- Menerima input sama, melakukan inferensi identik, hanya output syntax beda
- Tidak di-share, tidak di-cache

**Impact:**
- Kalau ada SQL type baru (misal `year`):
  - Add ke `mapSqlTypeToZod()` → Zod schema bekerja ✓
  - LUPA add ke `mapSqlTypeToTs()` → TS type salah ✗
  - **TypeScript tidak ketangkap** (kedua independent, bukan derivasi dari 1 source)
  - Silent bug di production
- Maintenance: 2x kerja untuk setiap perubahan type mapping

**Evidence:**
```
ZodTierGenerator.buildResponseZodType() [baris 512]
├─ mapSqlTypeToZod() [baris 835]
├─ mapCastToZod() [baris 857]

ZodTierGenerator.generateRead() [baris 867+]
├─ mapSqlTypeToTs() [baris 1148] — IDENTIK STRUKTUR
├─ mapCastToTs() [baris 1170] — IDENTIK STRUKTUR
├─ mapResolvedToTsType() [baris 1633] — PARALLEL KE buildResponseZodType()
```

---

### P5: IR Ada Tapi Tidak Digunakan — TINGGI

**Current State:**
- `normalizeManifest()` menghasilkan `NormalizedManifest` (lengkap, resolved types)
- Dijalankan di `generate.ts` line 47-50
- **Hasil ditampung di variable tapi TIDAK di-pass ke generator**
- Semua generator menerima `RouteManifest` mentah, bukan `NormalizedManifest`

**Impact:**
- IR sudah ada dan lengkap, tapi 100% dibuang
- Generator harus re-infer dari nol
- Kesempatan missed untuk single source of truth

**Evidence:**
```typescript
// generate.ts line 47-50
const normalizedManifest = normalizeManifest(manifest, kernel)
                                             ↑
                                    [ditampung tapi TIDAK DIPAKAI]

// Seharusnya:
await SDKGenerator.generate(normalizedManifest)

// Kenyataan:
await SDKGenerator.generate(manifest)  // raw, bukan normalized
```

---

### P6: Partial IR (routeResponseMap) Tidak Di-Export — TINGGI

**Current State:**
- `routeResponseMap` (Map<string, RouteResponseComposition>) dibuat di `generateContract()`
- Berisi metadata komposisi response (alias/fallback, collection, paginated, wrapped)
- Di-pass ke `generateRead()` dan `generateMapper()` (benar!)
- **Tidak pernah di-export, tidak pernah di-pass ke generator lain**
- `SDKGenerator` dan `HookGenerator` tidak tahu, re-infer sendiri

**Impact:**
- IR lokal bekerja baik dalam ZodTierGenerator
- Tapi tidak ada shared IR across generators
- SDKGenerator dan HookGenerator tetap standalone re-inference

**Evidence:**
```
generateContract()
  │ Create: routeResponseMap
  │
  ├─→ generateRead(routeResponseMap) ✓
  ├─→ generateMapper(routeResponseMap) ✓
  └─ STOP — routeResponseMap tidak keluar dari ZodTierGenerator
  
SDKGenerator — tidak terima routeResponseMap, re-infer sendiri
HookGenerator — tidak terima routeResponseMap, re-infer sendiri
```

---

### P7: Duplicate Manifest Traversal — SEDANG

**Current State:**
- `contractResponseCount` (generateContract, baris 294) — traversal for route counting
- `mapperAllRespCount` + `mapperGetOnlyCount` (generateMapper, baris 1207) — identik traversal
- Loop logic identik, IF conditions sama, increment logic sama
- Dijalankan 2x independen, menghasilkan data identik

**Impact:**
- Redundant computation (di 2000 routes, 2x traversal bukan bottleneck performa, tapi inelegant)
- Maintenance risk: kalau logic traversal berubah, update di 2 tempat

**Evidence:**
```
// generateContract() baris 294-298
for (const route of routes) {
  if (route.response) {
    contractResponseCount.set(r, (contractResponseCount.get(r) || 0) + 1)
  }
}

// generateMapper() baris 1207-1212 — SAMA PERSIS
for (const route of routes) {
  if (route.response) {
    mapperAllRespCount.set(r, (mapperAllRespCount.get(r) || 0) + 1)
  }
}
```

---

### P8: Temporal Coupling (knownSchemas) — SEDANG

**Current State:**
- `knownSchemas` adalah class-level `private static` Set
- Harus di-clear di awal `generate()` sebelum diisi
- Dikonsumsi di `generateContract()` untuk `isResourceAlias` check

**Impact:**
- Kalau method di-call langsung tanpa `generate()` (dari test/debug), `knownSchemas` bisa stale
- Silent wrong output (resource alias detection salah)
- Tidak bisa di-call method individual dari generator

**Evidence:**
```typescript
class ZodTierGenerator {
  private static knownSchemas = new Set<string>()  // Persists!
  
  static generate(manifest) {
    this.knownSchemas.clear()  // Must be called FIRST
    // ... populate ...
    this.generateContract()    // Assume knownSchemas populated
  }
}

// Risk: Direct call
ZodTierGenerator.generateContract(routes)  // knownSchemas belum di-clear!
```

---

### P9: Inconsistent Output Naming (put vs patch) — RENDAH

**Current State:**
- `api.ts` punya `profile.put` dan `profile.patch` sebagai dua entri terpisah
- Keduanya operation identik (update profile)
- `hooks.ts` juga duplikasi `actionKeys.put`/`actionKeys.patch` dan `cache.put`/`cache.patch`
- Di-maintain terpisah, padding duplikasi

**Impact:**
- Manual coordination untuk update profile logic
- Component harus tahu ada dua method identik
- Not a bug, tapi inelegant design

**Evidence:**
```
api.ts: profile.put + profile.patch (identik)
hooks.ts: actionKeys.put + actionKeys.patch (identik)
          cache.put + cache.patch (identik, invalidate target sama)
```

---

### P10: Inconsistent Cache Field Shape — RENDAH

**Current State:**
- `hooks.ts` field `cache` punya dua bentuk berbeda tanpa pembeda eksplisit:
  - Bentuk 1: `cache.list: QueryKey.categories.list` (direct key, untuk read)
  - Bentuk 2: `cache.create: { invalidate: [...] }` (object, untuk mutation)
- Developer harus tahu dari konteks untuk membedakan

**Impact:**
- Type confusion (tidak eksplisit mana read key, mana invalidate target)
- Tidak critical, tapi poor UX

---

## REQUIREMENTS

### R1: Unify ACTION_MAP — HARUS

**Requirement:**
- Consolidate `ACTION_MAP` menjadi 1 sumber kebenaran
- Location: `packages/cli/src/generators/names.ts` (sudah ada file ini)
- Export sebagai `export const ACTION_MAP = { post: 'Create', ... }`
- Semua generator import dari satu place

**Acceptance Criteria:**
- [ ] `names.ts` export `ACTION_MAP` const tunggal
- [ ] `ZodTierGenerator.ts` remove 4 duplicate definitions, import dari `names.ts`
- [ ] `HookGenerator.ts` remove ACTION_TO_CRUD_HOOK, import dari `names.ts`
- [ ] `SDKGenerator.ts` remove SDK_ACTION_MAP, import dari `names.ts`
- [ ] Semua reference tetap work (tidak ada breaking change di output)
- [ ] Test verify: ACTION_MAP dipakai konsisten di semua generator

**Effort:** Low (simple refactor, no logic change)

---

### R2: Extract Resource Resolution ke Shared Module — HARUS

**Requirement:**
- Buat modul baru `packages/cli/src/generators/resource-resolution.ts`
- Consolidate resource/model resolution logic
- Export function `resolveResponseType(metadata): ResolvedResponseType`
- Semua generator import + gunakan function yang sama

**Acceptance Criteria:**
- [ ] `resource-resolution.ts` ada dengan function `resolveResponseType()`
- [ ] Logic dari 4 implementasi dianalisa, logic terbaik dipilih
- [ ] Hasil resolution di-cache/di-IR untuk reuse
- [ ] `ZodTierGenerator.generateContract()` pakai function ini
- [ ] `HookGenerator` pakai function ini, remove `resolveBaseResponseName()` + `resolveResponseInfo()`
- [ ] `SDKGenerator` pakai function ini, remove `getResponseInfo()`
- [ ] Semua output files tetap identik (no behavior change)
- [ ] Test verify: resolution logic konsisten di semua caller

**Effort:** Medium (refactor 3-4 implementasi jadi 1, coordinate dengan consumers)

---

### R3: Unify Type Inference — HARUS

**Requirement:**
- Buat single type resolution system (bukan Zod vs TS paralel)
- Create interface `ResolvedType { kind: string, nullable: boolean, ... }`
- Single mapper dari SQL type → canonical representation
- Two renderers (TS renderer untuk TypeScript, Zod renderer untuk Zod)

**Acceptance Criteria:**
- [ ] `type-resolution.ts` ada dengan `ResolvedType` interface
- [ ] Single function `resolveSqlType(sqlType, cast, context): ResolvedType`
- [ ] `toZodExpression(resolved): string` untuk render Zod
- [ ] `toTsExpression(resolved): string` untuk render TS
- [ ] `ZodTierGenerator.generateContract()` ganti `mapSqlTypeToZod` pakai system baru
- [ ] `ZodTierGenerator.generateRead()` ganti `mapSqlTypeToTs` pakai system baru
- [ ] Semua output types tetap identik
- [ ] Test: add new SQL type → otomatis work di Zod dan TS

**Effort:** High (significant refactor, perlu careful testing)

---

### R4: Export routeResponseMap jadi Shared IR — HARUS

**Requirement:**
- `generateContract()` return `routeResponseMap`
- Pass ke `generateSchema()`, `generateField()` bukan cuma re-infer
- Export ke `SDKGenerator`, `HookGenerator`

**Acceptance Criteria:**
- [ ] `routeResponseMap` interface jelas di-dokumentasi
- [ ] `ZodTierGenerator.generate()` export `routeResponseMap` di return
- [ ] `generateSchema()` terima `routeResponseMap` sebagai parameter
- [ ] `generateField()` terima `routeResponseMap` sebagai parameter
- [ ] `SDKGenerator.generate()` terima `routeResponseMap` sebagai parameter
- [ ] `HookGenerator.generate()` terima `routeResponseMap` sebagai parameter
- [ ] All consumers re-implement: re-infer → baca dari IR
- [ ] Semua output tetap identik

**Effort:** Medium (parameter threading, existing logic re-use)

---

### R5: Pass NormalizedManifest ke Generators — HARUS

**Requirement:**
- `generate.ts` pass `normalizedManifest` (hasil `normalizeManifest()`) ke generators
- Bukan `manifest` raw mentah
- Update semua generator signature: `generate(normalizedManifest: NormalizedManifest, outputDir)`

**Acceptance Criteria:**
- [ ] `generate.ts` line 50+ pass `normalizedManifest` ke semua generator
- [ ] Semua 11 generator update signature ke `generate(normalizedManifest, ...)`
- [ ] Generators baca `NormalizedRoute.response` (resolved types) daripada `ParsedRoute.response`
- [ ] Semua output files tetap identik
- [ ] No re-inference needed (keputusan sudah di IR)

**Effort:** High (semua generator signature berubah, perlu coordinate)

---

### R6: Split ZodTierGenerator ke Modul Terpisah — HARUS

**Requirement:**
- Refactor ZodTierGenerator jadi 6 modul terpisah (bukan 6 method dalam 1 class)
- `ContractLayer.ts`, `SchemaLayer.ts`, `FieldLayer.ts`, `ReadLayer.ts`, `FormLayer.ts`, `MapperLayer.ts`
- Masing-masing independent, receive input dari IR
- Orchestrator di `ZodTierGenerator.ts` coordinate

**Acceptance Criteria:**
- [ ] 6 new files (`*Layer.ts`) di `packages/cli/src/generators/layers/`
- [ ] `ContractLayer.generate(normalizedManifest): routeResponseMap`
- [ ] `SchemaLayer.generate(normalizedManifest, routeResponseMap): void`
- [ ] etc untuk 4 layer lainnya
- [ ] `ZodTierGenerator.ts` jadi orchestrator (thin, <100 lines)
- [ ] Semua output files identik
- [ ] Test: individual layer bisa di-test, di-call terpisah

**Effort:** Very High (significant restructuring, many moving parts)

---

### R7: Remove knownSchemas Mutable State — HARUS

**Requirement:**
- Move `knownSchemas` dari class-static jadi parameter/return value
- Atau pass dari IR (normalizedManifest sudah tahu schema names)
- Eliminate temporal coupling

**Acceptance Criteria:**
- [ ] `knownSchemas` tidak lagi class-static
- [ ] Dihitung dari IR atau di-pass sebagai parameter
- [ ] `generateContract()` bisa di-call langsung tanpa persiapan state
- [ ] No temporal coupling
- [ ] Test: call `generateContract()` directly → still works

**Effort:** Low-Medium (state refactor, perlu careful threading)

---

### R8: Consolidate Manifest Traversal — BISA

**Requirement:**
- `contractResponseCount` dan `mapperAllRespCount` harus dihitung sekali
- Store di IR atau cache di object yang di-thread ke method
- Tidak perlu loop 2x yang identik

**Acceptance Criteria:**
- [ ] Response count dihitung sekali, di-cache
- [ ] `ContractLayer` dan `MapperLayer` membaca cache, bukan re-calculate
- [ ] Output tetap identik
- [ ] Test: verify count consistency

**Effort:** Low-Medium (caching logic)

---

### R9: Improve Cache Field Shape di HookGenerator — BISA

**Requirement:**
- Pisahkan `cache` menjadi `readKeys` dan `invalidateTargets`
- Explicit shape untuk read vs mutation

**Acceptance Criteria:**
- [ ] `hooks.ts` output punya `readKeys: {...}` dan `invalidateTargets: {...}`
- [ ] Developer tidak perlu tebak konteks
- [ ] Type-safe

**Effort:** Low (cosmetic change, HookGenerator)

---

### R10: Fix put/patch Duplication di Constants — BISA

**Requirement:**
- Unify `put` dan `patch` ke satu semantic action `update`
- `route-classifier.ts` map keduanya ke action yang sama

**Acceptance Criteria:**
- [ ] `route-classifier.ts` normalize PUT + PATCH ke UPDATE action
- [ ] `api.ts` punya satu `profile.update` (bukan put + patch)
- [ ] `hooks.ts` punya satu `update` action (bukan put + patch)
- [ ] HTTP method routing masih bekerja (backend terima PUT/PATCH)
- [ ] Test: verify routing

**Effort:** Medium (route classification refactor)

---

## PRIORITY & PHASING

### Phase 1: Consolidation (Low Risk, High Impact)
**Target:** Immediate wins, no breaking changes

- **R1: Unify ACTION_MAP** ← START HERE (1-2 hari)
  - Simpel, isolated, no impact ke architecture
  - Reduce duplikasi dari 6 ke 1 place

- **R2: Extract Resource Resolution** (2-3 hari)
  - Consolidate 4 implementasi ke 1
  - Start point untuk R5 (pass IR)

### Phase 2: IR Expansion (Medium Risk, Highest Impact)
**Target:** Single source of truth untuk keputusan compiler

- **R5: Pass NormalizedManifest ke Generators** (3-5 hari)
  - Thread IR dari manifest → semua generator
  - Prerequisite untuk R3, R4

- **R4: Export routeResponseMap jadi Shared IR** (2-3 hari)
  - Expand IR scope beyond ZodTierGenerator
  - SDKGenerator + HookGenerator baca IR, bukan re-infer

- **R3: Unify Type Inference** (5-7 hari)
  - Extract parallel systems jadi 1 + 2 renderers
  - Highest complexity, perlu comprehensive testing

### Phase 3: Refactoring (High Risk, Best Practices)
**Target:** Clean architecture, maintainability

- **R6: Split ZodTierGenerator** (5-10 hari)
  - From 1890-line God Object → 6 focused modules
  - Biggest refactor, perlu extensive testing

- **R7: Remove knownSchemas Mutable State** (2-3 hari)
  - Eliminate temporal coupling
  - Dependent pada R5, R6

### Phase 4: Polish (Low Risk, UX)
**Target:** Edge cases, consistency

- **R8: Consolidate Manifest Traversal** (1-2 hari)
- **R9: Improve Cache Field Shape** (1 hari)
- **R10: Fix put/patch Duplication** (2 hari)

---

## SUCCESS METRICS

### Quantitative

| Metric | Current | Target | Why |
|--------|---------|--------|-----|
| Duplicate ACTION_MAP locations | 6 | 1 | Single source of truth |
| Resource resolution implementations | 4 | 1 | Consistent behavior |
| Type inference systems (Zod vs TS) | 2 parallel | 1 + 2 renderers | Type-safe |
| ZodTierGenerator LOC | 1890 | ~300 (per module) | Maintainability |
| Mutable class-static state | 1 (knownSchemas) | 0 | Eliminate temporal coupling |
| Manifest traversal redundancy | 2x | 1x | Computational efficiency |
| Generator responsibility complexity | High | Low | SRP compliance |

### Qualitative

| Metric | Current | Target | Why |
|--------|---------|--------|-----|
| "Can I add new SQL type?" | "Update 2 places independently" | "Update 1 place, auto-propagate" | Reduce bugs |
| "Why is response aliased this way?" | "4 different implementations" | "One IR, all use same" | Consistency |
| "How do I test generateContract?" | "Setup knownSchemas manually" | "Call directly, no setup" | Testability |
| "Is the manifest normalized?" | "Yes, but unused" | "Yes, used everywhere" | Efficiency |
| "Can I understand one generator?" | "Need to read 1890 lines" | "Need to read 300 lines" | Understandability |

---

## IMPLEMENTATION CONSTRAINTS

### Must-Have (Non-Negotiable)

1. **Output Identity:** Generated output files MUST be 100% identical after refactor
   - No breaking changes untuk frontend consumers
   - Type names, file locations, format semua sama

2. **Backward Compatibility:** CLI interface tetap sama
   - `routesync sync --zod` tetap bekerja
   - Manifest input format tidak berubah

3. **No Breaking Changes:** Version bump bisa minor, bukan major
   - Semua existing projects tetap bisa `routesync sync`

### Nice-to-Have (Optimizations)

1. **Incremental Compilation:** Cache per-route, skip unchanged
   - Perlu `stableHash` di manifest
   - Benefit: faster iteration di large projects

2. **Parallel Generator Execution:** Run generators concurrently
   - Benefit: faster overall sync time
   - Prerequisite: IR fully immutable, no shared state

3. **Better Error Messages:** Point to exact source di manifest
   - Benefit: easier debugging di large projects

---

## RISK ANALYSIS

### Risk: Output Change (High Impact)

**Scenario:** Refactor changes output format, breaks existing projects  
**Mitigation:**
- Comprehensive diff testing (generate with old code, generate with new code, compare)
- Manual review of sample outputs
- Staged rollout to beta users first

**Effort:** 1-2 days (diff testing infrastructure)

---

### Risk: Performance Regression (Medium Impact)

**Scenario:** New IR expansion + threading slows down sync  
**Mitigation:**
- Benchmark baseline before refactor
- Monitor key operations (manifest traversal, type inference)
- Optimize hot paths if needed

**Effort:** 2-3 days (if optimization needed)

---

### Risk: Incomplete Type Coverage (Medium Impact)

**Scenario:** New unified type system misses edge cases (custom types)  
**Mitigation:**
- Comprehensive type mapping test suite
- Test all existing SQL types + custom types
- Fallback to `any` for unknown types (safe but not ideal)

**Effort:** 3-5 days (test suite)

---

## ROLLOUT PLAN

### Pre-Release

1. **Code Review** (1-2 days)
   - Architecture review
   - Output diff review
   - Test coverage review

2. **Testing** (3-5 days)
   - Unit tests (per-layer)
   - Integration tests (full pipeline)
   - Regression tests (sample real projects)
   - Performance tests (benchmark vs old code)

3. **Documentation** (2-3 days)
   - Update internal architecture docs
   - Generator layer specs
   - IR format specs

### Release

1. **Beta Release** (1-2 weeks)
   - Publish to npm with `@beta` tag
   - Gather feedback from beta users
   - Fix critical bugs

2. **GA Release**
   - Publish to npm as latest
   - Release notes + migration guide (if any)
   - Monitor for issues

---

## ESTIMATE

| Phase | Effort | Timeline |
|-------|--------|----------|
| Phase 1 (Consolidation) | 10-15 days | Week 1-2 |
| Phase 2 (IR Expansion) | 15-20 days | Week 3-5 |
| Phase 3 (Refactoring) | 10-20 days | Week 6-8 |
| Phase 4 (Polish) | 5-7 days | Week 9 |
| Testing + QA | 5-10 days | Throughout |
| **TOTAL** | **50-70 days** | **10-12 weeks** |

**Note:** Dapat dipercepat dengan parallel workstreams (Phase 1 + Phase 4 bisa parallel).

---

## APPROVAL

**Owner:** [Team Lead]  
**Approved By:** [Tech Lead/Architect]  
**Date Approved:** [TBD]

