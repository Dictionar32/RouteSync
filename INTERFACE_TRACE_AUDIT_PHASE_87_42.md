# RouteSync Interface Trace Audit — Phase 87.42

## Objective
Menutup porous runtime-shape inspection pada jalur Resource Field. Data semantic yang sudah dibentuk scanner tidak boleh kembali diperlakukan sebagai `unknown`, `any`, `Record<string, unknown>`, atau objek bebas oleh lowerer.

## Trace
Laravel PHP AST
  -> ResourceFieldDescriptor
  -> ResourceFieldExpression ADT
  -> SemanticType
  -> SemanticTypeResolver
  -> ResolvedSemanticType
  -> ResourceFieldFlattener
  -> Manifest Artifact / IR

## Changes
1. `ResourceFieldFlattener.flatten()` sekarang menerima `readonly ResourceFieldDescriptor[]`, bukan `Record<string, any> | readonly any[]`.
2. Nested object memakai `matchResourceFieldExpression()` sehingga traversal mengikuti ADT, bukan shape probing.
3. Array memakai `element.semanticType` langsung. Tidak ada lagi rekonstruksi tipe dari string atau fallback string.
4. `normalizeResourceFields(ParsedResource)` sekarang hanya mengembalikan `res.fields`, karena `ParsedResource.fields` sudah merupakan verified ordered collection.
5. Tidak ada reclassification runtime di flattener.

## Remaining P0
`ManifestArtifactLowerer` masih memiliki jalur legacy `route.response as any` dan flat route-property access. Ini harus dimigrasikan ke `route.binding.response` + `matchResponse()`.

## Remaining P1
- `fieldExtractors.ts` masih menyimpan helper `unknown` untuk compatibility path yang belum dimigrasikan.
- `route-response/shapeExtractor.ts` masih menggunakan `unknown` dan structural probing.
- `route-response/propertyProcessor.ts` masih menerima `readonly unknown[]`.
- `ResponseFieldData` masih merupakan legacy porous DTO (`type?`, `fields?`, `itemType?`, `resolved?`).
- `ResolutionContext` masih memakai `Record<string, ...>`.
- duplicate legacy `ModelNode` masih ada.

## Invariant
Setelah scanner menghasilkan `ParsedResource`, downstream wajib membaca:

`ParsedResource.fields -> ResourceFieldDescriptor -> ResourceFieldExpression -> SemanticType`

Bukan:

`ParsedResource.fields -> unknown -> Record -> tebakan -> fallback`.
