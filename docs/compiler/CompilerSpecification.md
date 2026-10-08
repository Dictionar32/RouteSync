# RouteSync Compiler Specification (Master Blueprint)
Version: 2.1.0-release
Status: Approved & Frozen

---

## BAB 1: PENDAHULUAN & VISI COMPILER

### 1.1 Visi Resmi
> **"RouteSync is a compiler platform that transforms Laravel applications into a stable, typed semantic graph, enabling multiple runtimes and code generators to consume the same application contract."**

RouteSync tidak dirancang sebagai generator kode instan untuk frontend tertentu. Desain arsitekturnya mengadopsi struktur compiler modern (seperti LLVM) di mana ekstraksi kode sumber, analisis semantik (Middle-end), dan pembuatan kode target (Backend) terisolasi sepenuhnya melalui perantara berkas kontrak independen (Compiler Intermediate Representation).

---

### 1.2 Konstitusi Utama Compiler (The Eight Laws)

Setiap kontribusi kode, pull request, dan refaktorisasi wajib mematuhi delapan hukum dasar berikut secara mutlak:

#### Law 1 — Single Source of Truth
Aplikasi Laravel adalah satu-satunya sumber kebenaran. Compiler dilarang meminta atau memaksakan penulisan konfigurasi frontend secara manual jika informasi tersebut dapat disimpulkan secara deterministik melalui analisis kode PHP, refleksi Laravel, atau skema database.

#### Law 2 — Semantic Completeness
Seluruh interpretasi makna bisnis (misalnya apakah suatu relasi adalah agregasi keranjang belanja, struktur promosi, atau workflow checkout) harus diselesaikan dan direpresentasikan sepenuhnya di dalam grafik perantara pada fase Middle-end. Generator backend tidak boleh melakukan tebakan semantik sendiri.

#### Law 3 — Stable IR
Perubahan pada fungsionalitas generator target (React, Vue, Flutter, OpenAPI, dsb.) tidak diperbolehkan mengubah struktur dasar grafik perantara Compiler IR (`routesync.manifest.json`). IR bertindak sebagai API kontrak publik yang stabil antar-fase kompilasi.

#### Law 4 — Platform Agnostic
Compiler IR wajib bersih dari terminologi spesifik framework (seperti React, Vue, TanStack Query, Next.js, dsb.) atau nama method target klien (`useCreate`). Representasi data di dalam IR hanya boleh menggunakan konsep abstrak murni seperti `operationId`, `aggregates`, `traits`, dan `capabilities`.

#### Law 5 — Zero Generator Intelligence
Generator backend bertindak sebagai *dumb renderer* murni. Generator hanya diperbolehkan membaca IR, mencocokkan pengenal, dan mencetak berkas kode target. Generator dilarang melakukan traversal relasi database mentah, menebak intensi domain, atau menggunakan heuristik pemecahan tipe data. Jika generator mulai memuat logika domain bersyarat (seperti `if (groupName === 'cart')`), maka middle-end pass harus diperbaiki.

#### Law 6 — Pass Isolation
Setiap compiler pass hanya memiliki satu tanggung jawab yang terisolasi. Evaluasi validasi dilarang dilakukan di dalam pass ekstraksi semantik, dan optimasi dilarang dilakukan di dalam generator backend.

#### Law 7 — Deterministic Compilation
Input kode sumber Laravel yang sama harus menghasilkan berkas manifes IR dan kode target yang identik secara biner. Compiler dilarang menghasilkan UUID acak saat berjalan, dilarang menulis timestamp kompilasi pada berkas output, dan wajib mengurutkan kunci objek secara alfabetis demi kebersihan git diff dan optimasi caching CI/CD.

#### Law 8 — IR First
Setiap fitur baru pada platform RouteSync wajib dideklarasikan dan dimodelkan di dalam skema IR terlebih dahulu. Jika suatu fitur tidak dapat direpresentasikan secara deklaratif di dalam IR, fitur tersebut belum boleh diimplementasikan oleh generator backend mana pun.

---

## BAB 2: INTERMEDIATE REPRESENTATION (IR) SPECIFICATION

RouteSync IR dimodelkan sebagai **Typed Semantic Graph** yang merepresentasikan seluruh struktur aplikasi backend Laravel ke dalam graf node-dan-edge.

### 2.1 Tipe Pengenal Unik Graf (Opaque Brand Types)
Untuk menjamin keamanan pengetikan data, compiler menggunakan teknik brand-typing pada TypeScript untuk mendeklarasikan ID node:

```typescript
export type NodeId = string & {
  readonly brand: "NodeId";
};

export type EdgeId = string & {
  readonly brand: "EdgeId";
};
```

### 2.2 Struktur Dasar Graf
Representasi graf memori disusun menggunakan kelas penampung graf (`SemanticGraph`) yang memuat daftar Node dan Edge:

```typescript
export interface IRNode {
  id: NodeId;
  kind: "operation" | "aggregate" | "trait" | "workflow" | "schema" | "event" | "property";
  symbol: string;
  displayName: string;
}

export interface IREdge {
  from: NodeId;
  to: NodeId;
  relation: "contains" | "implements" | "returns" | "calls" | "depends";
}

export interface SemanticGraph {
  compilerVersion: string;
  irVersion: string;
  schemaVersion: string;
  nodes: Record<string, IRNode>;
  edges: IREdge[];
}
```

---

## BAB 3: SPESIFIKASI NODE POLYMORPHIC (NODES)

Setiap entitas dalam graf dideklarasikan sebagai node khusus dengan tipe (`kind`) yang unik.

### 3.1 Operation Node
Operation Node mewakili endpoint API fisik yang diekspos oleh backend Laravel.

```typescript
export interface OperationNode extends IRNode {
  kind: "operation";
  protocol: HttpProtocol | GrpcProtocol | GraphQlProtocol;
  requestSchema?: NodeId;  // Merujuk ke SchemaNode
  responseSchema?: NodeId; // Merujuk ke SchemaNode
}

export interface HttpProtocol {
  transport: "http";
  descriptor: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
  };
}

export interface GrpcProtocol {
  transport: "grpc";
  descriptor: {
    service: string;
    method: string;
  };
}

export interface GraphQlProtocol {
  transport: "graphql";
  descriptor: {
    query: string;
    mutation?: string;
  };
}
```

### 3.2 Aggregate Node
Aggregate Node mendefinisikan batas transaksional domain agregat (seperti Cart atau Order).

```typescript
export interface AggregateNode extends IRNode {
  kind: "aggregate";
  traitRefs: NodeId[]; // Daftar pengenal TraitNode yang dikomposisi oleh agregat ini
  config: {
    collectionField: string;      // Nama field penampung koleksi (misal: "details")
    identityField: string;        // Field ID unik item (misal: "produkItemId")
    quantityField: string;        // Field jumlah item (misal: "qty")
    promotionCodeField: string;   // Field kode kupon (misal: "code")
  };
}
```

### 3.3 Trait Node
Trait Node mewakili modul kemampuan logis abstrak yang dapat digunakan kembali secara modular.

```typescript
export interface TraitNode extends IRNode {
  kind: "trait";
  symbol: string; // Pengenal global (misal: "CollectionTrait" atau "PromotionTrait")
  capabilities: Record<string, NodeId>; // Pemetaan aksi abstrak ke OperationNode.id
}
```

### 3.4 Workflow Node
Workflow Node merepresentasikan orkestrasi alur kerja terstruktur yang melibatkan beberapa operasi berurutan.

```typescript
export interface WorkflowStep {
  name: string;
  operation: NodeId; // Merujuk ke target OperationNode.id
}

export interface WorkflowNode extends IRNode {
  kind: "workflow";
  steps: WorkflowStep[];
}
```

### 3.5 Event Node
Event Node merepresentasikan batas rilis data secara asinkron atau komunikasi real-time.

```typescript
export interface EventNode extends IRNode {
  kind: "event";
  transport: "websocket" | "sse" | "webhook";
  payloadSchema: NodeId; // Skema data event (SchemaNode.id)
}
```

### 3.6 Schema Node & Property Node
Schema Node mewakili bentuk tipe data terstruktur untuk validasi data masukan/keluaran.

```typescript
export interface SchemaNode extends IRNode {
  kind: "schema";
  type: "object" | "array" | "string" | "number" | "boolean" | "enum";
  properties?: Record<string, NodeId>; // Merujuk ke PropertyNode anak
  items?: NodeId;                      // Jika type === "array", merujuk ke SchemaNode anak
  enumOptions?: string[];              // Opsi string jika type === "enum"
  requiredFields?: string[];           // Array nama field wajib
}

export interface PropertyNode extends IRNode {
  kind: "property";
  name: string;
  schemaRef: NodeId; // Merujuk ke SchemaNode penentu tipe properti
}
```

---

## BAB 4: SPESIFIKASI EDGE (RELATIONAL MAP)

Edge mendefinisikan batas relasi graf antarnode. Compiler memvalidasi tipe edge saat melintasi graf.

| Relasi Edge | Node Asal (From) | Node Target (To) | Deskripsi |
| :--- | :--- | :--- | :--- |
| `contains` | `SchemaNode` / `AggregateNode` | `PropertyNode` / `TraitNode` | Menyatakan kepemilikan struktural |
| `implements`| `CapabilityNode` | `OperationNode` | Menyatakan kapabilitas abstrak dipenuhi oleh operasi nyata |
| `returns` | `OperationNode` | `SchemaNode` | Menyatakan tipe data respons dari operasi |
| `calls` | `WorkflowNode` | `OperationNode` | Menyatakan urutan pemanggilan di dalam alur kerja |
| `depends` | `AggregateNode` | `AggregateNode` | Dependensi data antar-agregat |

---

## BAB 5: PASS MANAGER & MIDDLE-END PASSES

Fase Middle-end dikelola secara terpusat oleh **Pass Manager** yang memvalidasi dependensi input dan jaminan output untuk setiap pass.

### 5.1 Kontrak Formal Compiler Pass
Setiap pass di dalam compiler wajib mengimplementasikan struktur antarmuka berikut:

```typescript
export interface CompilerPass {
  name: string;
  requires: string[]; // Kebutuhan kapabilitas graf (prakondisi)
  produces: string[]; // Hasil jaminan kapabilitas graf (pascakondisi)
  run(context: CompilerContext): void;
}
```

---

### 5.2 Alur Evaluasi Pipeline Pass

#### 1. Semantic Resolution Pass
* **requires**: `["AST"]`
* **produces**: `["SemanticGraph"]`
* **Algoritma**:
  1. Melintasi AST kelas pengontrol (Controller) Laravel.
  2. Menganalisis anotasi PHP 8 (`#[Response]` atau `#[RouteSync]`).
  3. Membaca skema kolom database untuk menyusun skema tipe data awal.

#### 2. Trait Composition Pass
* **requires**: `["SemanticGraph"]`
* **produces**: `["AggregateGraph"]`
* **Algoritma & Aturan**:
  1. Mencari node agregat (`AggregateNode`) dalam graf.
  2. Menavigasi `traitRefs` pada agregat tersebut.
  3. Memasukkan kapabilitas trait secara dinamis ke agregat.
  4. **Pemeriksaan Dependensi**: Jika terdeteksi siklus relasi trait (Trait A depends on Trait B, Trait B depends on Trait A), pass akan mencatat diagnostic error `E1004`.

#### 3. Graph Optimization Pass
* **requires**: `["AggregateGraph"]`
* **produces**: `["OptimizedGraph"]`
* **Algoritma**:
  1. **Dead Node Elimination**: Melacak semua rute operasional. Jika ada `OperationNode` yang tidak terhubung dengan edge `implements` atau tidak dipanggil oleh `WorkflowNode`, node tersebut dipangkas.
  2. **Schema Deduping**: Membandingkan kemiripan struktural (`structural equality`) antarnode skema. Jika identik, properti yang merujuk digabungkan ke satu skema tunggal.

#### 4. Validation Pass
* **requires**: `["OptimizedGraph"]`
* **produces**: `["ValidatedGraph"]`
* **Algoritma**:
  1. Menavigasi seluruh node dan memvalidasi kecocokan invariant compiler.
  2. Menambahkan diagnostic error atau warning jika ditemukan ketidaksesuaian kontrak.

#### 5. Serialization Pass
* **requires**: `["ValidatedGraph"]`
* **produces**: `["SerializedManifest"]`
* **Algoritma**:
  1. Mengurutkan kunci-kunci objek manifest secara alfabetis untuk menjamin determinisme.
  2. Menulis data terformat ke dalam berkas `routesync.manifest.json`.

---

## BAB 6: PLUGIN API & COMPILER CONTEXT

Pengembang dapat memperluas fungsi compiler tanpa mengubah kode inti dengan menyematkan plugin daur hidup.

### 6.1 Antarmuka Konteks Compiler

```typescript
export interface CompilerContext {
  ast: RawAST;
  graph: {
    nodes: Map<string, IRNode>;
    edges: IREdge[];
  };
  diagnostics: Diagnostic[];
  config: Record<string, unknown>;
}

export interface RawAST {
  routes: unknown[];
  models: unknown[];
}
```

### 6.2 Daur Hidup Plugin (Plugin Lifecycle Hooks)

```typescript
export interface CompilerPlugin {
  name: string;
  version: string;
  
  setup?(context: CompilerContext): Promise<void>;
  
  beforeExtract?(context: CompilerContext): void;
  afterExtract?(context: CompilerContext): void;
  
  beforeSemantic?(context: CompilerContext): void;
  afterSemantic?(context: CompilerContext): void;
  
  beforeOptimize?(context: CompilerContext): void;
  afterOptimize?(context: CompilerContext): void;
  
  beforeBackend?(context: CompilerContext): void;
  afterBackend?(context: CompilerContext): void;
}
```

---

## BAB 7: SISTEM DIAGNOSTIK & VALIDASI (VALIDATION)

Validation Pass bertanggung jawab untuk mendeteksi anomali pada Contract Graph dan mencatatnya ke dalam sistem Diagnostik terpusat.

### 7.1 Struktur Diagnostik

```typescript
export interface Diagnostic {
  severity: "error" | "warning";
  code: string;        // Kode identifikasi unik
  message: string;     // Deskripsi kesalahan informatif
  nodeId?: NodeId;     // Pengenal node yang memicu anomali
}
```

### 7.2 Daftar Kode Kesalahan (Errors - Menggagalkan Build)
* **E1001 — Missing Schema**: Node operasi tidak memiliki skema request atau response yang valid.
* **E1002 — Orphaned Workflow Step**: Langkah alur kerja merujuk ke target operationId yang tidak ada di graf.
* **E1003 — Duplicate Capability**: Dua nama kapabilitas yang sama terdaftar pada satu agregat.
* **E1004 — Cyclic Trait Dependency**: Hubungan dependensi antar-trait berbentuk sirkular.

### 7.3 Daftar Kode Peringatan (Warnings - Build Tetap Jalan)
* **W2001 — Unused Schema**: Skema terdaftar tetapi tidak pernah dirujuk oleh operasi atau properti mana pun.
* **W2002 — Aggregate Lacking Traits**: Agregat dideklarasikan tanpa mengomposisi trait sama sekali.
* **W2003 — Missing Display Name**: Node dideklarasikan tanpa deskripsi nama untuk debugging.

---

## BAB 8: COMPATIBILITY POLICY

Kebijakan ini menjamin bahwa evolusi skema IR tidak akan mematahkan ekosistem runtime yang sudah berjalan.

### 8.1 Kebijakan Versi
* **Perubahan Minor (irVersion: 1.x.y)**:
  * Harus kompatibel mundur (*backward compatible*).
  * Penambahan properti opsional baru atau Node Kind baru diperbolehkan.
  * Backend generator yang mendukung versi minor sebelumnya harus tetap dapat berjalan tanpa modifikasi kode.
* **Perubahan Mayor (irVersion: X.0.0)**:
  * Diizinkan merilis perubahan merusak (*breaking changes*).
  * Penghapusan Node Kind atau restrukturisasi format relasi Edge diperbolehkan.
  * Backend generator wajib memperbarui deklarasi kepatuhan versi IR mayor.

---

## BAB 9: BACKEND GENERATOR CONTRACTS

Backend bertindak sebagai *renderer* tipis yang menerjemahkan IR menjadi kode target spesifik platform.

### 9.1 React Backend (hooks.ts)
* Membaca `routesync.runtime.ts` (Runtime Contract).
* Membuat QueryKey terstruktur secara dinamis berbasis `symbol` agregat.
* Memetakan kapabilitas agregat ke pembungkus (*wrapper*) React Query mutation.

### 9.2 Vue Backend (composables.ts)
* Membaca kontrak runtime yang sama.
* Menghasilkan fungsi `reactive` dan `computed` yang mengikat aksi CRUD ke komposisi Vue.

### 9.3 AI Agent & MCP Backend (tools.json)
* Membaca seluruh `capabilities` dan skema `SchemaNode` masukan.
* Menghasilkan spesifikasi model pemanggilan fungsi (*function calling schema*) JSON terformat OpenAPI yang kompatibel dengan protokol agen kecerdasan buatan (seperti MCP).
