# Interface Trace Fix — Request Identity — 2026-09-20

## Origin boundary

RequestType now carries `RequestIdentity`:
- requestClass
- formType
- resource

FormRequestScanner supplies the actual FormRequest class name. Derived RequestTypes receive a deterministic identity at their construction boundary.

## Removed downstream re-classification

- Controller action validation no longer normalizes Request/Form/Create/Update names. It resolves by the exact `FormRequestDescriptor.name` identity.
- requestSourceMerger no longer strips `Resource` or lowercases names. It merges through `request.identity.resource`.
- pipelineScanner no longer searches RequestTypes with `find()` + lowercase comparison. It uses an indexed resource identity.
- route groups no longer synthesize `${resource}Form` or `[]` when a request is missing. Missing RequestType is an origin-boundary invariant violation and fails explicitly.

## Result

```text
FormRequest source
  -> RequestIdentity
  -> RequestType
  -> indexed RequestType
  -> ResourceRouteGroup
  -> Manifest
  -> downstream
```

No request-name normalization remains in `actionValidationExtractor.ts` or `requestSourceMerger.ts`.
