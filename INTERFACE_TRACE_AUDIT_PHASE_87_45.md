# RouteSync Interface Trace Audit — Phase 87.45

## Objective
Menaikkan response semantic ke upstream boundary sehingga request-response deriver tidak lagi melakukan konversi ulang dari expression mentah, tidak membuat fallback response dari nama domain, dan tidak membawa `any` sebagai semantic input.

## Trace
Laravel AST
  -> verified ParsedResource / ParsedRoute
  -> RouteBindingContract.response (closed ResponseDescriptor)
  -> ResourceFieldDescriptor[]
  -> field.semanticType
  -> ResponseData
  -> RequestType
  -> contract lowerer

## Changes
1. `responseDeriver.ts` tidak lagi menerima converter `(raw: any) => SemanticType`.
2. Response fields mengambil `field.semanticType` yang sudah ditentukan upstream.
3. Route response dibaca dari `route.binding.response`, bukan flat/legacy response shape.
4. `deriveFallbackResponseData()` dihapus. Tidak ada synthetic response berdasarkan `rawDomain`/`bareDomain`.
5. `groupAggregator.ts` tidak lagi membangun `modelIndex` hanya untuk mengklasifikasikan ulang response expression.
6. `rawTypeConverter.ts` dihapus dari request-response derivation path karena semantic conversion sudah selesai pada ResourceFieldDescriptor boundary.
7. `RequestTypeDeriver` tetap menerima models untuk compatibility API, tetapi response derivation tidak bergantung pada model fallback.

## Invariant
Downstream response derivation tidak boleh:
- menerima `any`/`unknown` sebagai semantic input;
- menebak kind dari object shape;
- mengubah raw expression menjadi semantic type kedua kali;
- membuat response contract dari nama domain jika route response belum terverifikasi.

## Ecommerce-shop implication
Untuk `register.post -> RegisterResponse`, `data` hanya dapat memperoleh tipe dari `ResponseDescriptor`/`ResourceFieldDescriptor` yang berasal dari Laravel AST. Jika upstream tidak berhasil mengidentifikasi expression `data`, hasilnya tetap unresolved/absent dan generator tidak boleh mengganti dengan model atau resource tebakan.

## Remaining P0
Trace `RegisterResponse.data` sampai controller/resource AST dan pastikan expression binding menghasilkan `ResourceFieldDescriptor.semanticType` sebelum manifest/IR.

## Remaining P1
- legacy `ResponseFieldData` compatibility surfaces
- `ResolutionContext` Record maps
- `ExpressionNode [key: string]: unknown`
- duplicate legacy `ModelNode`
- generic assertion utilities under semantic path
- `deriveRouteAction` legacy `any`/optional schema probing
