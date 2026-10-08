# Phase 232 — Declarative Semantic Relations + Solver Migration

## Tujuan

Phase ini meneruskan Phase 230/231 dengan memindahkan keputusan semantik yang masih
berbentuk branch menjadi relasi deklaratif yang diselesaikan oleh relation/rewrite
engine.

Arsitektur:

```text
syntax/evidence
    ↓
canonical semantic facts
    ↓
declarative relations + rewrite rules
    ↓
fixed-point relation solver
    ↓
derived semantic answers
    ↓
analysis consumers
```

## Migrasi

### 1. Semantic relation solver

`semanticRelationSolver.ts` menyediakan:

- relation tuple facts;
- variable binding;
- multi-premise relational joins;
- declarative rewrites;
- fixed-point saturation;
- derived-fact deduplication.

`Map`/`Set` hanya digunakan sebagai index/deduplication mechanics.

### 2. Knowledge lattice

`joinSemanticKnowledgeLattice()` tidak lagi menentukan semantik join melalui
`if` branch. Sembilan kombinasi lattice direpresentasikan sebagai relation rules:

```text
join(uninitialized, uninitialized) -> uninitialized
join(uninitialized, known)         -> known
join(uninitialized, top)           -> top
join(known, uninitialized)         -> known
join(known, known)                 -> known
join(known, top)                   -> top
join(top, uninitialized)           -> top
join(top, known)                   -> top
join(top, top)                     -> top
```

Solver menghasilkan kind; consumer hanya memilih representasi state berdasarkan
hasil relasi.

### 3. State location

`semanticStateDataFlow.ts` tidak lagi memakai `switch` untuk menentukan identity
location. Location kind menggunakan declarative resolver table. Index key tetap
derivatif dan bukan source of truth.

### 4. Object identity / alias

`semanticObjectIdentity.ts` sekarang menggunakan relation rewrites untuk:

```text
may-alias(a,b) -> identity-link(a,b)
may-alias(a,b) -> identity-link(b,a)
same-identity(a,b) -> alias-answer(a,b,must-alias)
identity-link(a,b) -> alias-answer(a,b,may-alias)
```

Dengan demikian klasifikasi alias tidak lagi ditentukan oleh conditional branch
pada query consumer.

## Boundary yang sengaja dipertahankan

Tidak semua `if/for/while/switch` harus dihapus secara mekanis.

- `for`/`while` di relation solver dan worklist adalah **solver mechanics**.
- `if` untuk termination/budget, deduplication, dan queue mutation adalah
  **interpreter/analysis mechanics**.
- `switch` pada `phpAstSemanticKnowledgeDataFlowAdapter.ts` adalah **evidence
  decoding** dari bentuk AST ke canonical semantic facts. Itu bukan sumber
  semantic meaning; hasilnya masuk ke semantic Knowledge/Data-Flow model.

Target Phase 232 adalah menghapus control-flow syntax sebagai semantic policy,
bukan mengubah implementasi solver menjadi kode tanpa control flow.

## Research basis

Desain ini mengikuti beberapa pola compiler/static-analysis yang sudah mapan:

- MLIR PDLL memisahkan pattern matching dan rewrite secara deklaratif.
- MLIR Pattern Rewriter menggunakan pattern definition + application untuk
  transformasi DAG.
- LLVM MemorySSA memodelkan memory state sebagai versioned def/use/phi overlay
  dan menyediakan walker/query di atas representasi tersebut.
- CodeQL membedakan AST dari semantic data-flow graph; `if` statement sendiri
  bukan node data-flow karena tidak membawa runtime value.
- Soufflé memodelkan static analysis sebagai relations, facts, rules, dan
  recursive fixed-point evaluation.

## Validation

Focused TypeScript compilation untuk relation solver, canonical knowledge model,
lattice, state data-flow, rule engine, dan object identity berhasil.

Runtime tests untuk declarative relation rewriting dan lattice join berhasil.
