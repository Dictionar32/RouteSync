# Phase 44 — Controller Dataflow Origin Boundary

## Scope
Seluruh `packages/core/src` aktif, dengan pengecualian `packages/core/src/compiler.ts` karena file tersebut legacy.

## Trace
Sebelumnya `controllerDataflowAnalyzer.ts` menentukan semantic variable reference dengan:

- mencari `ast.definitions` dari belakang;
- `find()` definition yang namanya sama;
- memeriksa `availability.kind === 'definite'`;
- mengambil `definition.semantic`.

Pola ini berarti semantic variable origin belum menjadi state dataflow; consumer/produser berikutnya masih harus mengorelasikan reference dengan definition.

## Perbaikan
`FlowState` sekarang membawa:

```text
FlowState
├── definite
├── semantic
└── path
```

`semanticForValue(variable_reference)` mengambil semantic dari state semantic map, bukan reverse-search `definitions`.

Saat assignment diproses, semantic fact hasil assignment langsung masuk ke state melalui `withDefinite(...)`.

Parameter semantic dari `ControllerMethodAst` diteruskan ke `parseControllerBody()` dan `analyzeControllerDataflow()`, sehingga parameter request/model juga tersedia di origin boundary.

Branch merge mempertahankan semantic hanya ketika kedua branch memiliki semantic yang sama; semantic yang berbeda menjadi `external`, sehingga tidak ada semantic yang dipalsukan.

## Interface follow-up
`types/upstream/controller.ts` sudah memiliki vocabulary baru:

- `ControllerExpressionOrigin`
- `ControllerExpressionFact`

Ini sengaja belum dipaksakan ke `ControllerResourceBinding`, karena mapper generic `PhpAstValue -> upstream Expression` belum menjadi canonical SSOT. Memaksa penggunaannya sekarang akan menyebabkan kehilangan provenance/semantic data atau cast.

## Verification
Targeted TypeScript diagnostics untuk:

- `controllerDataflowAnalyzer.ts`
- `controllerBodyParser.ts`
- `controllerMethodParser.ts`
- `controllerDataflowContract.ts`
- `types/upstream/controller.ts`

menghasilkan **0 error** pada phase configuration yang tersedia.

Global compilation masih memiliki error legacy/migration di area lain; error tersebut tidak digunakan sebagai alasan untuk melemahkan interface controller.

## Result

```text
PHP AST
  ↓
Controller dataflow analyzer
  ↓
FlowState semantic facts   ← origin boundary
  ↓
ControllerVariableDefinition.semantic
  ↓
ControllerSemanticDataflow
```

`packages/core/src/compiler.ts` legacy tetap tidak disentuh.
