# RouteSync Interface Trace Audit — Phase 87.38

## Objective
Menutup dua kebocoran model upstream: duplicate `ModelNode` contract dan type-guard berbasis `unknown` pada variable semantic resolution. Registry lookup juga dipindahkan dari porous `Record<string, Rule>` ke `ReadonlyMap`, sehingga tabel lookup menjadi struktur koleksi eksplisit dan ADT tetap menjadi payload-nya.

## Trace

```text
Laravel PHP AST
  -> scanner ModelNodeInput
  -> verifyModelNode()
  -> semantic ModelNode
  -> SymbolTable<ModelNode>
  -> resolver context
  -> SemanticResolution
  -> BoundSemanticNode
  -> RouteSync IR
```

## Changes

1. `SymbolTable` sekarang mengimpor `ModelNode` langsung dari `semantic/modelNodes`.
2. `resolveAssignmentVariable()` menerima `ModelNode | undefined`, bukan `ModelNode | unknown`, dan tidak lagi melakukan structural probing (`typeof`, `in`).
3. `resolveThisVariable()` menerima `ModelNode | undefined` dan hanya memeriksa boundary optional yang sah.
4. `FrameworkRegistry` menggunakan `ReadonlyMap` untuk global/method/variable lookup. Dynamic string lookup tetap hanya terjadi di registry boundary.
5. `FrameworkReturnDescriptor` tetap closed ADT: `scalar | model | object`.
6. Typed object fields tetap dibawa ke `ObjectType` dan `SemanticResolution`, sehingga tidak hilang di Bound AST.

## Remaining P0

`FieldNode` masih mempunyai `resolved?: SemanticResolution`. Ini adalah kebocoran arsitektural terbesar yang tersisa karena syntax AST dan semantic state masih bercampur. Target berikutnya:

```text
ParsedFieldNode -> ResolvedFieldBinding -> BoundSemanticNode
```

bukan mutasi/penempelan `resolved` ke syntax node.

## Remaining P1

- `types/semantic/modelGraphTypes.ts` masih memiliki model graph legacy terpisah dari semantic `ModelNode`.
- `ResolutionContext` masih memiliki `Record<string, ...>` untuk assignment/resolution lookup.
- `ExpressionNode` masih mempunyai `[key: string]: unknown` sebagai legacy compatibility surface.
- Manifest/resource compatibility types masih mempunyai `resolved?`, `semantic?`, `type?`, dan `Record<string, ...>`; semuanya perlu dipindahkan ke verified boundary, bukan dihapus secara membabi buta.

## Verification

Narrow TypeScript check masih menghasilkan baseline diagnostics di domain vocabulary/collection modules. Tidak ada diagnostic dari perubahan `FrameworkRegistry`, `SymbolTable`, `modelNodes`, atau variable resolvers.
