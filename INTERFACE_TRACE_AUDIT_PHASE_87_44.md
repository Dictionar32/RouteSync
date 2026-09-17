# RouteSync Interface Trace Audit — Phase 87.44

## Objective
Memutus data bebas yang masih lolos pada contract-generation path. Upstream semantic model harus menjadi closed ADT; downstream builder/artifact hanya membawa data yang sudah diberi makna.

## Trace
Laravel PHP AST
  -> verified response/resource descriptors
  -> semantic response fields
  -> GeneratedContractAction
  -> contract builder
  -> GeneratedContractArtifact

## Changes
1. `GeneratedContractAction.fieldCount` sekarang required. Tidak ada lagi `fieldCount ?? 0` di artifact boundary.
2. `requestSectionBuilder` hanya membaca `action.schemaCode`. Jalur compatibility `schemaLines/schemaCode` melalui `as any` dihapus.
3. `contractArtifactBuilder` hanya membaca typed `schemaCode` dan `fieldCount`. Tidak ada shape probing atau fallback cast.
4. `ResponseFieldData` dipersempit menjadi closed discriminated union berdasarkan `kind`. Tidak lagi berupa satu object dengan kombinasi properti bebas.
5. `ResponseFieldResolved` dipersempit menjadi union `resolved(type) | resolved(model) | unresolved(reason)`.
6. `typeNormalizer.normalizeKind()` menerima discriminator ADT, bukan `string`, dan tidak memiliki default fallback.
7. `extractType()` sekarang melakukan exhaustive dispatch berdasarkan `kind`; `unknown` hanya muncul sebagai hasil semantic unresolved variable/property, bukan karena bentuk object tidak dikenali.

## Dataflow invariant
No downstream stage may infer the response field shape from arbitrary properties. The discriminator established upstream is the only classification input.

## Remaining P0/P1
- P0: response origin for `RegisterResponse.data` must still be traced to the Laravel controller/resource expression so `unknown` is not introduced before the semantic boundary.
- P1: `ResponseFieldData` itself should eventually be replaced by the newer `ResourceFieldDescriptor` path entirely; current closed union is a compatibility bridge, not the final architecture.
- P1: `GeneratedContractAction` dependency construction still permits a default resolver in its constructor. Move construction to the origin boundary when the remaining callers are migrated.
- P1: `ResolutionContext` still contains Record-based semantic maps.
- P1: duplicate legacy `ModelNode` remains in `types/semantic/modelGraphTypes.ts`.
- P1: legacy `ExpressionNode` still exposes `[key: string]: unknown`.

## Verification
The narrow TypeScript configuration still reports pre-existing baseline errors in `types/domain/*`. No claim is made that the whole repository is clean. The edited contract-generation path no longer uses the removed `as any` compatibility access in `requestSectionBuilder` or `contractArtifactBuilder`.
