# Phase Error Repair 04 — HTTP Vocabulary

## Root cause
`RequestContentType` had multiple representations: MIME strings, `RequestMimeType` ADT, `string | null`, `null`, and a `Record<..., any>` dispatcher.

## Repair
- `RequestMimeType` is now the canonical semantic MIME ADT.
- `RequestHeaderExpression` is closed and no longer a raw string/null pair.
- JSON, multipart, urlencoded and none descriptors carry typed MIME values.
- `REQUEST_CONTENT_TYPE_REGISTRY` now contains typed MIME/header ADTs; `none` is explicit rather than null.
- `ScannedRequestContentTypeDescriptor.mimeType` is `RequestMimeType`, not `string | null`.
- `fromKind()` reads the exhaustive registry directly; no fallback to `none`.
- `matchRequestContentType()` accepts a descriptor, preserving its semantic data instead of reconstructing it from a primitive.
- Removed the `Record<RequestContentType, (d: any) => R>` dispatch and the null fallback from this contract.

## Verification
Targeted TypeScript check of `httpVocabulary.ts` reaches unrelated existing errors in `httpErrors.ts`, `validationRules.ts`, `domain/index.ts`, and legacy `types/route.ts`; no diagnostic points to the repaired HTTP vocabulary declarations themselves.

## Remaining root clusters
1. validation factory/ADT boundary
2. missing `RequestField`
3. legacy `types/route.ts` barrel drift
4. remaining domain AST/SSA errors

## Next
Trace validation factory producers against the current validation ADTs. Do not reintroduce null/string fallbacks.
