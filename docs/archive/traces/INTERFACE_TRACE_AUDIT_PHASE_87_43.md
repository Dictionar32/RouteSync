# RouteSync Interface Trace Audit — Phase 87.43

## Objective
Menutup kebocoran `unknown`/`any` pada jalur response Laravel AST -> semantic -> IR.

## Trace yang diperbaiki

Laravel AST
  -> ResponseDescriptor (closed ADT)
  -> InlineResponseDescriptor.fields: ResourceFieldDescriptor[]
  -> ResourceFieldExpression ADT
  -> SemanticType
  -> ObjectProperty
  -> Response ObjectType / IR

Untuk resource/model response:

ResponseDescriptor(resource|model)
  -> typed synthetic `data` ResourceFieldDescriptor
  -> resource/model expression
  -> ReferenceType(<Target>Transformed)
  -> response ObjectType

## Perubahan

1. `route-response/propertyProcessor.ts`
   - `readonly unknown[]` dihapus.
   - `Record<string, unknown>` dihapus.
   - string-based `kind` probing dihapus.
   - model lookup dari raw object dihapus.
   - tipe response diambil langsung dari `ResourceFieldDescriptor.semanticType`.
   - nested object dan array didispatch lewat `matchResourceFieldExpression()`.

2. `route-response/shapeExtractor.ts`
   - `rawFields: readonly unknown[]` diganti `fields: readonly ResourceFieldDescriptor[]`.
   - inline response langsung membawa field descriptor upstream.
   - resource/model response membentuk field `data` melalui typed expression factory, bukan object bebas.

3. `routeResponseDeriver.ts`
   - menerima `shape.fields`, bukan raw entries.

4. `ManifestArtifactLowerer.ts`
   - `route.response as any` dihapus.
   - response didispatch melalui `matchResponse()`.
   - inline mapper hanya membaca `response.fields` yang sudah terverifikasi.

5. `responseDescriptors.ts`
   - `matchResponse()` tidak lagi memakai `descriptor as any`.
   - exhaustive switch atas ResponseKind menjadi origin-safe catamorphism.

## Invariant

Tidak ada downstream response consumer yang boleh menentukan ulang bentuk response dari JavaScript object shape.

Forbidden:
- `as any`
- `as unknown as Record<string, unknown>`
- `Array.isArray(rawFields)` untuk response semantic
- `'fields' in response` sebagai klasifikasi response
- fallback response type dari string bebas

Allowed:
- `matchResponse()`
- `matchResourceFieldExpression()`
- `SemanticType` sebagai semantic payload
- typed synthetic descriptor yang dibuat di scanner boundary

## Remaining high priority

- `ResponseFieldData` legacy di `compiler/generators/contract-generation/response-field/` masih porous dan harus diputus dari semantic path.
- `contractArtifactBuilder.ts` masih memiliki `as any` pada action artifact.
- `RequestSectionBuilder.ts` masih memakai `as any` dan fallback schema.
- `shapeExtractor` masih menggunakan nama route string untuk synthetic response naming; ini adalah naming concern, bukan semantic type fallback.
