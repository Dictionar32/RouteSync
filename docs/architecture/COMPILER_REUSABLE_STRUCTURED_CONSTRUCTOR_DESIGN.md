# Compiler Reusable Structured Constructor Design & TDD Blueprint

**Target Scope**: `@routesync/core` → `src/compiler/` (Passes, Generators, and Domain Builders)  
**Status**: Discussion & Design Document  
**Date**: 2026-08-29  

---

## 1. Executive Summary & Goals

Dokumen ini mendefinisikan standar arsitektur untuk **Structured Constructor & Origin Boundary Pattern** di seluruh modul `@routesync/core/src/compiler`.

### Prinsip Utama (Sesuai AGENTS.md Rule 8):
1. **Origin Boundary Guarantee**: Semua dependensi dan opsi diselesaikan dan divalidasi di *Origin Boundary* (Constructor / Factory) menggunakan **Named Options Object Contract + Destructuring Defaults**.
2. **Zero Defensive Fallbacks Downstream**: Hilangkan kebutuhan `??`, `?.`, `|| []`, atau pemeriksaan tipe defensif di dalam method flow (`run()`, `generate()`, `build()`) karena kontrak data sudah dijamin utuh sejak instansiasi.
3. **Strict TDD Workflow**: 
   $$\text{Design .md} \longrightarrow \text{Type Contract Test (Vitest)} \longrightarrow \text{Flow & Invariant Test} \longrightarrow \text{Implementation Refactoring} \longrightarrow \text{100\% GREEN Verification}$$

---

## 2. Peta Area Komponen di `packages/core/src/compiler`

```
                                  ┌────────────────────────────────┐
                                  │     Origin Boundary (Entry)    │
                                  │   Named Options Object Pattern │
                                  └───────────────┬────────────────┘
                                                  │
            ┌─────────────────────────────────────┼─────────────────────────────────────┐
            ▼                                     ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐             ┌───────────────────────┐
│     Compiler Passes   │             │   Action Generators   │             │     Code Builders     │
├───────────────────────┤             ├───────────────────────┤             ├───────────────────────┤
│ • TypeScriptGenPass   │             │ • FormActionGenerator │             │ • ContractCodeBuilder │
│ • FormGeneratorPass   │             │ • ContractActionGen   │             │ • FormCodeBuilder     │
│ • MapperGeneratorPass │             │ • MapperFieldGen      │             │ • MapperCodeBuilder   │
│ • ApiFieldGenPass     │             │                       │             │                       │
└───────────────────────┘             └───────────────────────┘             └───────────────────────┘
```

---

## 3. Type Vocabulary Design (TTD)

### 3.1. Universal Pass Constructor Contract (`PassConstructorOptions`)
Setiap Compiler Pass harus menerima konfigurasi dan dependensi melalui *named options object* tunggal:

```typescript
export interface CompilerPassDependencies<TOptions = Record<string, unknown>> {
    readonly options?: TOptions;
    readonly resolver?: SemanticTypeResolver;
    readonly logger?: CompilerLogger;
}
```

**Constructor Signature Pattern**:
```typescript
export class ExamplePass implements CompilerPass<TInput, TOutput> {
    private readonly options: Readonly<Required<ExamplePassOptions>>;
    private readonly resolver: SemanticTypeResolver;

    constructor({
        options = DEFAULT_OPTIONS,
        resolver = defaultTypeResolver
    }: ExamplePassDependencies = {}) {
        this.options = Object.freeze({ ...DEFAULT_OPTIONS, ...options });
        this.resolver = resolver;
    }
}
```

### 3.2. Action Generator Structured Value Object Contract
Alih-alih menerima argumen terpisah `(actionName: string, fields: readonly Field[])`, Action Generator menerima data terstruktur atau mengelola dependensi yang terinjeksi:

```typescript
export interface ActionGeneratorDependencies<TMapper> {
    readonly mapper?: TMapper;
    readonly resolver?: SemanticTypeResolver;
}

export interface ActionPayload<TField> {
    readonly actionName: string;
    readonly fields: readonly TField[];
    readonly metadata?: Readonly<Record<string, unknown>>;
}
```

### 3.3. Code Builder Structured Options Contract
Code Builder menerima hasil lowering / artifacts yang sudah terstruktur tanpa melakukan parsing ulang:

```typescript
export interface CodeBuilderDependencies {
    readonly indentSize?: number;
    readonly headerComment?: string;
}
```

---

## 4. TDD & Vitest Testing Plan (Sebelum Implementasi Kode)

Setiap tahap refactor harus didahului oleh pembuatan file test spesifik di folder `__tests__/`:

### Tahap 1: Type Contract Tests (`expectTypeOf`)
- Menguji bahwa constructor menerima `{}` (empty object) tanpa throw exception.
- Menguji bahwa parameter constructor kompatibel dengan *Named Options Object*.
- Menguji immutability instance (`Object.isFrozen`).

### Tahap 2: Flow & Origin Boundary Tests
- Menguji bahwa injeksi custom resolver / custom mapper di constructor benar-benar diteruskan dan digunakan di seluruh private method.
- Menguji bahwa tanpa parameter apa pun (`new Pass()`), default singleton / default options digunakan secara deterministik (0% memory churn).

### Tahap 3: Regression Verification
- Menjalankan seluruh test suite yang ada:
  ```bash
  npm run build && npx vitest run --reporter=verbose
  ```
- Memastikan output sebelum vs sesudah 100% identik.

---

## 5. Rencana Bertahap (Execution Roadmap)

| Fase | Komponen Target | File Lokasi | Target Refactor |
|---|---|---|---|
| **Fase 1** | **Form Pipeline** | `generators/form-generation/` & `passes/FormGeneratorPass.ts` | Constructor injection untuk `FormFieldMapper` & `FormActionGenerator` |
| **Fase 2** | **Mapper Pipeline** | `passes/MapperGeneratorPass.ts` & `generators/mapper/` | Constructor injection untuk `SemanticTypeResolver` & mapper builders |
| **Fase 3** | **TypeScript Pipeline** | `passes/TypeScriptGeneratorPass.ts` & `generators/typescript/` | Standardisasi options & dependency injection |
| **Fase 4** | **ApiField Pipeline** | `passes/ApiFieldGeneratorPass.ts` | Standardisasi options object pattern |

---

## 6. Checklist Verifikasi Standar
- [ ] Constructor menggunakan Named Options Object (`{ opt1, dep1 } = {}`).
- [ ] Defaults diselesaikan di Origin Boundary (Constructor), bukan di dalam method `run()` / `generate()`.
- [ ] Tidak ada runtime nullish coalescing defensif (`?? ''`, `|| []`) di internal execution path.
- [ ] 100% Vitest pass tanpa merusak SDK regression tests.
