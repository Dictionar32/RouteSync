# RouteSync Interface Trace Audit — Phase 87.39

## Objective
Memisahkan syntax AST dari semantic result pada boundary Laravel AST sehingga informasi resolved tidak ditempelkan kembali ke node parser.

## Canonical dataflow

Laravel PHP source
  -> Laravel/PHP AST
  -> Parsed FieldNode                 [syntax only]
  -> SemanticResolutionKernel.resolve
  -> FieldBinding                     [syntax + semantic result]
  -> BoundSemanticNode                [semantic meaning]
  -> RouteSync IR                     [stable semantic carrier]
  -> Pure Lowerers
  -> Emitters

## P0 change

`BaseField.resolved?: SemanticResolution` dihapus.

Sebelum:

ParsedFieldNode
  -> `resolved?`
  -> same object carries syntax + semantic state

Sesudah:

ParsedFieldNode
  -> SemanticResolution
  -> `createFieldBinding()`
  -> ResolvedFieldBinding | UnresolvedFieldBinding

`FieldBinding` is a closed ADT:
- `resolved`: syntax + resolved semantic meaning
- `unresolved`: syntax + explicit semantic failure state

Tidak ada `unknown` payload dan tidak ada optional semantic slot pada FieldNode.

## P0 resolver cleanup

`targetModelResolver.ts` tidak lagi melakukan structural probing:

- removed `isModelNode(obj: unknown)`
- removed `ModelNode | unknown`
- model lookup memakai typed `ModelNode` dari `SymbolTable`
- direct lookup dipisahkan dari case-insensitive lookup secara eksplisit

## Ecommerce-shop trace finding

Artefak `routesync.manifest.traced.json` menunjukkan `RegisterResponse.data` masih:

`type: unknown`, `nullable: true`

sementara `$token` sudah menghasilkan `string` melalui `createToken -> object -> plainTextToken`.

Artinya semantic pipeline sudah mampu membawa tipe object tertentu, tetapi jalur response wrapper/field declaration masih dapat kehilangan informasi. Ini harus diperbaiki di origin semantic binding, bukan dengan fallback generator.

Contoh trace yang sudah sehat:

`$token`
  -> VariableResolver
  -> FrameworkRegistryResolver.createToken
  -> typed object field `plainTextToken: string`
  -> ExpressionResolver
  -> string

## Remaining P1

1. `packages/core/src/types/semantic/modelGraphTypes.ts` masih memiliki duplicate legacy `ModelNode`.
2. `ResolutionContext.assignments` dan `resolvedAssignments` masih memakai `Record<string, ...>`.
3. `semantic/types.ts` memiliki legacy `ExpressionNode` dengan `[key: string]: unknown`.
4. Legacy `ResourceFieldKind` / `ResponseMetadata` masih porous dan perlu dimigrasikan ke domain ADT.
5. `ResourceFieldFlattener.ts` masih melakukan fallback chain dari `semanticType/resolved/type` dan harus dipindahkan ke satu typed origin boundary.

## Rule for next phase

Jangan menambahkan fallback baru.

Urutan migrasi:

`legacy raw input -> verified ADT -> semantic binding -> bound AST -> IR`

Bukan:

`raw input -> generator -> coba beberapa shape sampai berhasil`
