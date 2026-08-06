# Skill: Reverse Engineering Codebase

## Deskripsi

Skill ini memandu analisis sistematis terhadap codebase untuk memahami arsitektur, data flow, dan implementasi sebenarnya sebelum memberikan rekomendasi atau melakukan perubahan.

## Tujuan Utama

Memahami codebase secara akurat melalui bukti implementasi, bukan asumsi berdasarkan nama atau pola umum.

---

## Prinsip Utama

**JANGAN PERNAH** mengasumsikan perilaku sistem berdasarkan:
- Nama file
- Nama class
- Nama interface
- Nama method
- Pola umum framework
- Pengalaman dari proyek lain

**SELURUH KESIMPULAN** harus berasal dari implementasi yang benar-benar ditemukan pada codebase.

---

## Fase 1: Memahami Arsitektur

Sebelum melakukan perubahan apa pun, lakukan identifikasi terhadap:

### Komponen Utama
- **Entry point**: Di mana eksekusi dimulai?
- **Pipeline utama**: Bagaimana alur utama sistem?
- **Layer arsitektur**: Apa saja layer dan tanggung jawabnya?
- **Dependency**: Siapa bergantung pada siapa?
- **Lifecycle data**: Kapan data dibuat, diubah, dan dibuang?
- **Ownership data**: Siapa yang memiliki dan mengontrol data?

### Checklist Fase 1
- [ ] Entry point teridentifikasi dengan bukti (file:line)
- [ ] Pipeline utama terpetakan end-to-end
- [ ] Layer arsitektur terdokumentasi dengan tanggung jawab
- [ ] Dependency graph tergambar
- [ ] Lifecycle setiap data penting terdokumentasi
- [ ] Ownership setiap struktur data jelas

**JANGAN** melanjutkan implementasi sebelum seluruh komponen utama dipahami.

---

## Fase 2: Data Flow Analysis

Untuk setiap objek penting (Artifact, IR, AST, Result, Constraint, dll), identifikasi:

### 1. Producer
- **Di mana dibuat?** (file:line)
- **Siapa yang membuat?** (component/function)
- **Kapan dibuat?** (lifecycle stage)

### 2. Transformation
- **Diubah oleh siapa?** (component/function)
- **Kapan berubah?** (lifecycle stage)
- **Apa yang berubah?** (properties/fields)

### 3. Consumer
- **Dibaca siapa?** (component/function)
- **Dipakai untuk apa?** (purpose)
- **Kapan tidak digunakan lagi?** (lifecycle stage)

### Template Data Flow
```
[DataStructure]
├── Producer: [Component] (file:line)
│   └── Dibuat pada: [Stage]
├── Transformers:
│   ├── [Component1]: modifies [fields] (file:line)
│   └── [Component2]: enriches [fields] (file:line)
└── Consumers:
    ├── [Component3]: reads [fields] for [purpose]
    └── [Component4]: reads [fields] for [purpose]
```

**Buat alur lengkap**: Producer → Transformation → Consumer

---

## Fase 3: Dependency Analysis

Untuk setiap komponen, identifikasi:

### Direct Dependencies
- **Imports apa?** (module names)
- **Menggunakan apa?** (specific classes/functions)
- **Injected dependencies?** (constructor parameters)

### Reverse Dependencies
- **Siapa yang menggunakan komponen ini?**
- **Siapa yang memanggil method ini?**
- **Siapa yang bergantung pada interface ini?**

### Checklist Dependency
- [ ] Semua import traced ke penggunaan aktual
- [ ] Unused imports teridentifikasi
- [ ] Circular dependencies terdeteksi
- [ ] Layer violations terdokumentasi

**JANGAN** hanya melihat import statement.  
**TELUSURI** penggunaan aktual dalam kode.

---

## Fase 4: Pipeline Reconstruction

Rekonstruksi pipeline **sebenarnya** berdasarkan implementasi.

### Contoh Reconstruction
```
Entry Point: CLI
    ↓
Scanner (parses input)
    ↓
CompilationState (accumulates artifacts)
    ↓
PassManager (executes passes)
    ↓ Pass1: Analysis
    ↓ Pass2: Resolution
    ↓ Pass3: Generation
    ↓
ArtifactRegistry (stores results)
    ↓
Emitter (generates code)
    ↓
Writer (saves files)
```

### Verification
- [ ] Setiap tahap dipetakan ke implementasi aktual
- [ ] Data yang mengalir antar tahap teridentifikasi
- [ ] Side effects setiap tahap terdokumentasi
- [ ] Error paths terpetakan

**JANGAN** menggunakan pipeline berdasarkan dokumentasi jika implementasi berbeda.

---

## Fase 5: Cross Verification

Bandingkan beberapa sumber informasi:

### Sumber Informasi
1. **README.md** - Deskripsi high-level
2. **Dokumentasi** - API docs, design docs
3. **Interface definitions** - Type declarations
4. **Implementation** - Actual code

### Jika Ditemukan Ketidaksesuaian

**JANGAN** memilih salah satu sebagai "benar".

**LAPORKAN** dengan format:
```markdown
🚨 KETIDAKSESUAIAN DITEMUKAN

**Lokasi**: [File/Component]

**Dokumentasi menyatakan**:
[Quote dari dokumentasi]

**Implementasi aktual**:
[Quote dari kode dengan file:line]

**Dampak**:
[Penjelasan dampak ketidaksesuaian]

**Rekomendasi**:
[Perbaikan yang diperlukan]
```

---

## Fase 6: Evidence Collection

**SETIAP KESIMPULAN WAJIB MEMILIKI BUKTI**

### Format Bukti yang Benar

✅ **BENAR**:
```markdown
**Artifact dibuat oleh**:
- Component: CompilerPipeline
- Method: buildArtifacts()
- Location: CompilerPipeline.ts:150-200
- Evidence: `return new ResponseArtifact(...)`

**Artifact dikonsumsi oleh**:
- Component: TypeScriptGenerator
- Method: generate()
- Location: Generator.ts:80
- Evidence: `const response = artifact.response`
```

❌ **SALAH**:
```markdown
"Sepertinya Artifact dipakai oleh Generator."
"Mungkin dibuat di CompilerPipeline."
"Biasanya dikonsumsi setelah semantic analysis."
```

### Klasifikasi Bukti

**✅ FAKTA** (Didukung oleh implementasi)
- Ada bukti kode yang jelas
- Dapat diverifikasi dengan membaca file
- Tercatat dengan file:line reference

**🔍 INFERENSI** (Kesimpulan logis)
- Tidak eksplisit, tapi logis dari bukti
- Reasoning dijelaskan dengan jelas
- Didukung oleh multiple evidence points

**❓ HIPOTESIS** (Dugaan yang perlu verifikasi)
- Belum terbukti dari implementasi
- Perlu investigasi lebih lanjut
- Ditandai dengan jelas sebagai hipotesis

---

## Fase 7: Critical Thinking

Untuk setiap keputusan desain, tanyakan:

### 5 Pertanyaan Kritis
1. **Mengapa dibuat seperti ini?**
   - Apa reasoning di balik desain?
   - Apa masalah yang diselesaikan?

2. **Apa alternatifnya?**
   - Desain alternatif apa yang mungkin?
   - Mengapa alternatif tidak dipilih?

3. **Apa trade-offnya?**
   - Performance vs maintainability?
   - Simplicity vs flexibility?
   - Memory vs speed?

4. **Apa dampaknya jika diubah?**
   - Komponen apa yang terpengaruh?
   - Breaking changes apa yang terjadi?

5. **Komponen apa yang harus ikut berubah?**
   - Dependency apa yang perlu update?
   - Test apa yang perlu modifikasi?

**JANGAN** memberikan rekomendasi tanpa menjawab pertanyaan-pertanyaan ini.

---

## Fase 8: Gap Analysis

Cari dan laporkan:

### Technical Debt
- [ ] **Dead code** - Kode yang tidak terpakai
- [ ] **Duplicate responsibility** - Fungsi yang overlap
- [ ] **Circular dependency** - Import cycles
- [ ] **Layer violation** - Cross-layer dependencies yang tidak seharusnya

### Architecture Issues
- [ ] **Dependency inversion rusak** - Abstraction tidak konsisten
- [ ] **Data flow tidak konsisten** - Alur data membingungkan
- [ ] **Naming menyesatkan** - Nama tidak sesuai fungsi
- [ ] **Dokumentasi tidak sesuai** - Docs vs implementasi berbeda

### Template Gap Report
```markdown
## Gap Analysis Report

### 1. Dead Code
- File: [path]
- Evidence: [tidak ada reference]
- Recommendation: [remove atau refactor]

### 2. Circular Dependencies
- Cycle: A → B → C → A
- Evidence: [import chain]
- Impact: [sulit test, coupling tinggi]
- Recommendation: [break cycle dengan interface]
```

---

## Fase 9: Implementation Readiness

Sebelum menulis kode, pastikan checklist ini terpenuhi:

### Pre-Implementation Checklist
- [ ] ✅ Producer diketahui (siapa yang membuat data)
- [ ] ✅ Consumer diketahui (siapa yang menggunakan data)
- [ ] ✅ Data flow diketahui (alur data end-to-end)
- [ ] ✅ Dependency diketahui (siapa bergantung pada siapa)
- [ ] ✅ Pipeline diketahui (tahap-tahap eksekusi)
- [ ] ✅ Dampak perubahan diketahui (apa yang akan break)

### Jika Salah Satu Belum Diketahui

**JANGAN** implementasi.  
**LANJUTKAN** analisis sampai semua checklist terpenuhi.

---

## Aturan Anti-Halusinasi

### Prinsip Utama
**JANGAN** mengisi kekosongan informasi dengan asumsi.

### Jika Informasi Tidak Ditemukan
```markdown
❌ JANGAN: "Sepertinya dibuat oleh ComponentX"
✅ LAKUKAN: "Belum ditemukan pada implementasi. Perlu investigasi lebih lanjut."
```

### Jika Hubungan Belum Pasti
```markdown
❌ JANGAN: "Mungkin ComponentA memanggil ComponentB"
✅ LAKUKAN: "Belum cukup bukti untuk menyimpulkan hubungan antara ComponentA dan ComponentB."
```

### Klasifikasi yang Jelas

Bedakan dengan jelas:

**📌 FAKTA**
- Didukung oleh implementasi
- Dapat diverifikasi
- Reference: file:line

**🔍 INFERENSI**
- Kesimpulan logis
- Reasoning dijelaskan
- Didukung multiple facts

**❓ HIPOTESIS**
- Dugaan belum terbukti
- Perlu verifikasi
- Ditandai sebagai "needs investigation"

**JANGAN** mencampur kategori ini dalam laporan.

---

## Format Laporan Standar

Selalu hasilkan laporan dengan struktur berikut:

```markdown
# Reverse Engineering Report: [Component/Feature Name]

## 1. Ringkasan Eksekutif
[2-3 paragraf overview temuan utama]

## 2. Entry Point Analysis
**Primary Entry**:
- Location: [file:line]
- Called by: [caller component]
- Parameters: [input types]

**Secondary Entries**:
- [List jika ada]

## 3. Pipeline Reconstruction
```
[Visual diagram alur]
```

**Evidence**:
- Stage 1: [file:line]
- Stage 2: [file:line]
- ...

## 4. Data Flow Analysis

### ResponseArtifact (contoh)
**Producer**:
- Created by: SemanticResolver.resolve()
- Location: SemanticResolver.ts:120
- Stage: Semantic Analysis

**Transformers**:
- EnrichmentPass: adds metadata (file:line)
- ValidationPass: validates structure (file:line)

**Consumers**:
- TypeScriptGenerator: converts to TSTypeNode
- ContractEmitter: emits contract definitions

## 5. Dependency Graph
```
ComponentA
  ├─ depends on: ComponentB
  └─ depends on: ComponentC
ComponentB
  └─ depends on: ComponentD
```

**Evidence**: [import statements dengan locations]

## 6. Lifecycle Analysis

### ResponseArtifact Lifecycle
1. **Creation**: SemanticAnalysis stage
2. **Mutation**: EnrichmentPass, ValidationPass
3. **Finalization**: After ValidationPass
4. **Consumption**: Generation stage
5. **Disposal**: After code emission

## 7. Ownership Analysis

### Data Structure: ResponseArtifact
1. **Owner**: SemanticResolver
2. **Creators**: SemanticResolver.resolve()
3. **Mutators**: EnrichmentPass, ValidationPass
4. **Readers**: TypeScriptGenerator, ContractEmitter
5. **Validity**: Semantic → Generation stages
6. **Finalization**: After ValidationPass
7. **Mutability**: Mutable during passes, immutable after
8. **Source**: Derived from Manifest + Semantic Analysis
9. **Layer Access**: Compiler layer only
10. **Deletion Impact**: Breaks generation pipeline

## 8. Temuan & Issues

### Critical Issues
- [Issue 1 dengan severity, evidence, impact]
- [Issue 2 ...]

### Architectural Concerns
- [Concern 1 dengan reasoning]
- [Concern 2 ...]

### Technical Debt
- [Debt 1 dengan recommendation]
- [Debt 2 ...]

## 9. Ketidaksesuaian Dokumentasi

### Ketidaksesuaian 1
**Dokumentasi**: [quote]
**Implementasi**: [quote dengan file:line]
**Impact**: [penjelasan]
**Recommendation**: [fix yang diperlukan]

## 10. Bukti Implementasi

### Evidence Log
- [Evidence 1]: [description] (file:line)
- [Evidence 2]: [description] (file:line)
- ...

## 11. Dampak Analisis

### If Changed: [Proposed Change]
**Direct Impact**:
- Component1: [how affected]
- Component2: [how affected]

**Indirect Impact**:
- Component3: [how affected via Component1]

**Migration Effort**: [Low/Medium/High]
**Risk Level**: [Low/Medium/High/Critical]

## 12. Rekomendasi

### Priority 1 (Critical)
- [Recommendation 1]
  - Reasoning: [why]
  - Evidence: [supporting facts]
  - Effort: [estimate]

### Priority 2 (Important)
- [Recommendation 2]
  - ...

### Priority 3 (Nice to Have)
- [Recommendation 3]
  - ...

## 13. Tingkat Keyakinan

**Overall Confidence**: [High/Medium/Low]

**High Confidence Areas**:
- [Area 1]: Backed by clear implementation
- [Area 2]: Multiple evidence points

**Low Confidence Areas**:
- [Area 1]: Needs further investigation
- [Area 2]: Incomplete information

**Information Gaps**:
- [ ] [Gap 1]: Needs investigation of [files]
- [ ] [Gap 2]: Needs runtime testing
- [ ] [Gap 3]: Needs documentation review

## 14. Next Steps

### Immediate Actions
1. [Action 1]: [description]
2. [Action 2]: [description]

### Follow-up Investigations
1. [Investigation 1]: [what to analyze]
2. [Investigation 2]: [what to verify]

### Blocked Items
- [Item 1]: Blocked by [reason]
- [Item 2]: Needs [requirement]
```

---

## Ownership & Lifecycle: 10 Pertanyaan Wajib

Untuk setiap struktur data penting (AST, Artifact, IR, Constraint, Result):

### 1. Siapa yang memiliki (owner) data ini?
```markdown
**Owner**: [ComponentName]
**Evidence**: [File:Line where created/managed]
**Lifetime**: From [creation point] to [disposal point]
**Cleanup**: [How/when is data freed]
```

### 2. Siapa yang boleh membuatnya?
```markdown
**Authorized Creators**:
- [Component1]: via [factory/method] (file:line)
- [Component2]: via [factory/method] (file:line)

**Not Allowed**:
- [Component3]: Violates [principle]
```

### 3. Siapa yang boleh mengubahnya?
```markdown
**Mutators**:
- [Component1]: can modify [fields] (file:line)
- [Component2]: can modify [fields] (file:line)

**Immutable After**: [Stage/Event]
**Rationale**: [Why mutation restricted]
```

### 4. Siapa yang hanya boleh membaca?
```markdown
**Read-Only Consumers**:
- [Component1]: reads [fields] for [purpose]
- [Component2]: reads [fields] for [purpose]

**Enforcement**: [Type system | Runtime | Convention]
```

### 5. Pada tahap pipeline mana data ini masih valid?
```markdown
**Valid Stages**:
✅ [Stage1]: Data current/accurate
✅ [Stage2]: Data current/accurate
❌ [Stage3]: Data stale (replaced by [NewData])

**Invalidation Triggers**:
- [Event] → data becomes stale
- [Condition] → data must refresh
```

### 6. Pada tahap mana data ini dianggap final?
```markdown
**Becomes Final At**: [Stage/Event]
**Evidence**: [File:Line where frozen/sealed]

**Before Finalization**:
- State: [Mutable/Building/Partial]
- Can be changed by: [Components]

**After Finalization**:
- State: [Immutable/Frozen/Sealed]
- Changes: Not allowed / Create new instance
```

### 7. Apakah data ini mutable atau immutable?
```markdown
**Mutability**: [Fully Immutable | Partially Mutable | Fully Mutable]

**Implementation**:
- readonly properties: [Yes/No] (file:line)
- Object.freeze(): [Yes/No] (file:line)
- Deep immutability: [Yes/No]

**Mutation Points** (if mutable):
- [Field]: mutable during [Stage] by [Component]

**Immutability Guarantees**:
- Structural sharing: [Yes/No]
- Copy-on-write: [Yes/No]
```

### 8. Apakah data ini merupakan source of truth atau hasil turunan?
```markdown
**Classification**: [Source of Truth | Derived Data | Cache]

**If Source of Truth**:
- Primary for: [Domain/Concept]
- Authoritative for: [What information]
- Derived data depending on this:
  * [DerivedData1] (via [transformation])
  * [DerivedData2] (via [transformation])

**If Derived**:
- Source: [SourceData] (file:line)
- Transformation: [How computed]
- Synchronization: [When updated]
- Can be recomputed: [Yes/No]
- Cache strategy: [None | LRU | TTL]
```

### 9. Apakah data ini boleh dikonsumsi lintas layer?
```markdown
**Layer Restrictions**: [Allowed | Prohibited | Conditional]

**If Allowed**:
- Available to layers: [Layer1, Layer2]
- Access mechanism: [Direct import | Service | Registry]
- Visibility: [Public API | Internal]

**If Prohibited**:
- Restricted to layer: [LayerName]
- Rationale: [Encapsulation | Coupling | Performance]
- Alternative: Use [PublicInterface] instead

**If Conditional**:
- Allowed when: [Condition]
- Via adapter: [AdapterName]
- With transformation: [TransformationLogic]

**Evidence**:
- Package exports: [file:line]
- Access modifiers: [public/private/protected]
- Actual usage: [grep results]
```

### 10. Jika data dihapus, komponen apa saja yang akan rusak?
```markdown
**Direct Dependencies** (breaks immediately):
- [Component1]: uses [field/method] (file:line)
- [Component2]: uses [field/method] (file:line)

**Indirect Dependencies** (breaks transitively):
- [Component3]: via [Component1]
- [Component4]: via [Component2]

**Alternative Approaches**:
1. [Alternative1]: Use [replacement]
2. [Alternative2]: Refactor to [new approach]

**Migration Complexity**: [Low | Medium | High]
**Estimated Effort**: [X hours/days]
**Risk Level**: [Low | Medium | High | Critical]
```

---

## Contoh Penerapan: RouteSync ResponseArtifact

```markdown
# Ownership Analysis: ResponseArtifact

## 1. Owner
**Owner**: SemanticResolutionKernel
**Evidence**: SemanticResolutionKernel.ts:150 (creates and manages)
**Lifetime**: From semantic resolution to code emission
**Cleanup**: Garbage collected after generation complete

## 2. Creators
**Authorized**:
- SemanticResolutionKernel.resolve() (file:line 150)
- Test factories: createMockResponseArtifact() (test files)

**Not Allowed**:
- Direct construction by generators
- Manual instantiation outside semantic layer

## 3. Mutators
**Mutators**:
- EnrichmentPass: adds metadata fields (file:line 200)
- ValidationPass: sets validation flags (file:line 300)

**Immutable After**: ValidationPass completion
**Enforcement**: readonly properties + convention

## 4. Read-Only Consumers
**Consumers**:
- TypeScriptGenerator: reads type information
- ContractEmitter: reads for contract generation
- Debug tools: displays artifact info

**Enforcement**: TypeScript readonly modifiers

## 5. Valid Stages
**Valid**:
✅ Semantic Analysis: Being created
✅ Enrichment: Being enhanced
✅ Validation: Being validated
✅ Generation: Used for code gen
❌ After Emission: Superseded by generated code

**Invalidation**: After TypeScriptEmitter completes

## 6. Finalization Point
**Final At**: After ValidationPass
**Evidence**: ValidationPass.ts:150 marks as validated

**Before**: Mutable, building state
**After**: Immutable, complete information

## 7. Mutability
**Type**: Partially Mutable → Final Immutable

**Implementation**:
- readonly: Yes (most properties)
- Object.freeze(): No (convention-based)
- Deep immutability: Partial

**Mutation Period**: During pass execution only

## 8. Data Lineage
**Classification**: Derived Data

**Source**: 
- Manifest route data
- Semantic type resolution
- Model schema information

**Transformation**: SemanticResolution + Enrichment
**Position**: Manifest → [ResponseArtifact] → TSTypeNode

## 9. Layer Access
**Restrictions**: Conditional

**Allowed to**: 
- Compiler passes (internal)
- Generation layer

**Prohibited**: 
- CLI direct access
- Public API exposure

**Rationale**: Internal compiler representation

## 10. Deletion Impact
**Direct Breaks**:
- TypeScriptGenerator: Expects ResponseArtifact input
- ContractEmitter: Depends on response info
- All generation passes

**Indirect Breaks**:
- Complete code generation pipeline
- CLI integration (via generators)

**Alternatives**: None (core artifact)
**Migration**: N/A (cannot remove)
**Risk**: CRITICAL
```

---

## Panduan Penggunaan Skill

### Kapan Menggunakan Skill Ini?

✅ **Gunakan Saat**:
- Memulai bekerja pada codebase baru
- Sebelum refactoring besar
- Menginvestigasi bug kompleks
- Mendesain perubahan arsitektur
- Onboarding anggota tim baru
- Dokumentasi arsitektur

❌ **Tidak Perlu Untuk**:
- Bug fix sederhana (scope jelas)
- Perubahan kecil pada komponen tunggal
- Kode yang sudah sangat dipahami

### Workflow Rekomendasi

```
1. Identifikasi scope → Apa yang perlu dipahami?
2. Fase 1-3 (Quick scan) → 2-4 jam
3. Fase 4-6 (Deep analysis) → 4-8 jam
4. Fase 7-9 (Critical review) → 2-4 jam
5. Generate report → 1-2 jam
6. Review dengan tim → 1 jam
---
Total: ~1-2 hari untuk codebase medium
```

### Tingkat Detail

**Small Change** (< 100 LOC):
- Fase 1-3: Quick scan
- Fase 4-6: Skip jika straightforward
- Fase 7-9: Mental checklist
- Report: Brief summary

**Medium Change** (100-500 LOC):
- Fase 1-6: Full analysis
- Fase 7-9: Written checklist
- Report: Structured document

**Large Change** (> 500 LOC atau architectural):
- Fase 1-9: Complete process
- Report: Comprehensive document
- Team review: Required

---

## Checklist Kualitas Laporan

Laporan reverse engineering yang baik memenuhi kriteria:

### Completeness
- [ ] Semua 9 fase terdokumentasi
- [ ] Semua komponen utama teranalisis
- [ ] Data flow lengkap termapping
- [ ] Dependencies tergambar jelas

### Evidence Quality
- [ ] Setiap claim ada bukti (file:line)
- [ ] Fakta, inferensi, hipotesis terpisah jelas
- [ ] Tidak ada asumsi tanpa basis
- [ ] Code quotes akurat

### Actionability
- [ ] Rekomendasi spesifik dan actionable
- [ ] Prioritas jelas (P1/P2/P3)
- [ ] Effort estimate tersedia
- [ ] Risk assessment lengkap

### Clarity
- [ ] Struktur mengikuti template standar
- [ ] Diagram visual jelas
- [ ] Tidak ada jargon tanpa penjelasan
- [ ] Executive summary informatif

---

## Anti-Pattern yang Harus Dihindari

### ❌ Anti-Pattern 1: Assumption-Based Analysis
```markdown
SALAH: "ComponentX pasti menggunakan pattern Y karena namanya..."
BENAR: "ComponentX menggunakan pattern Z. Evidence: implementasi di file:line"
```

### ❌ Anti-Pattern 2: Documentation-First
```markdown
SALAH: "Dokumentasi bilang seperti ini, jadi implementasinya pasti..."
BENAR: "Implementasi seperti ini (file:line). Dokumentasi perlu update."
```

### ❌ Anti-Pattern 3: Surface-Level Analysis
```markdown
SALAH: "File ini import A dan B, jadi dependency-nya A dan B."
BENAR: "File import A dan B. A digunakan di line X untuk Y. B digunakan di line Z untuk W."
```

### ❌ Anti-Pattern 4: Premature Implementation
```markdown
SALAH: Langsung coding setelah lihat 2-3 file
BENAR: Coding setelah Pre-Implementation Checklist terpenuhi semua
```

### ❌ Anti-Pattern 5: Mixed Classification
```markdown
SALAH: "Berdasarkan fakta X dan asumsi Y, kesimpulannya Z."
BENAR: 
- FAKTA: X (evidence: file:line)
- INFERENSI: Y berdasarkan X (reasoning: ...)
- KESIMPULAN: Z (confidence: medium, needs verification)
```

---

## Maintenance & Evolution

Skill ini adalah **living document**. Update jika:
- Menemukan pattern baru yang useful
- Menemukan anti-pattern baru yang harus dihindari
- Ada feedback dari penggunaan praktis
- Ada improvement pada process

**Version**: 1.0.0  
**Last Updated**: 2026-08-05  
**Status**: Active

---

## Referensi & Resource

### Internal Documents
- `/home/annas-zen/Documents/RouteSync/.kiro/steering/evidence-based-architecture.md`
- RouteSync architectural documentation
- Phase 3 implementation reports

### Tools yang Membantu
- `grep -r` untuk tracing usage
- TypeScript language server untuk "Find All References"
- VS Code "Go to Definition" / "Go to Implementation"
- Git blame untuk understanding evolution
- Runtime debugger untuk verification

### Recommended Reading
- "Working Effectively with Legacy Code" - Michael Feathers
- "Software Design X-Rays" - Adam Tornhill
- "Code That Fits in Your Head" - Mark Seemann
