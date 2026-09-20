# Interface Trace / Fix — Request Binding Origin — 2026-09-20

## Trace

```text
Laravel FormRequest
    ↓
FormRequestScanner              (schema facts)
    ↓
ControllerScanner              (exact FormRequest class binding)
    ↓
RouteBindingContract.formRequests
    ↓
RequestTypeDeriver              (assembly only)
    ↓
RequestType / RequestIdentity
    ↓
mergeRequestTypeSources         (enrichment by exact request class)
    ↓
RouteManifest                   (passthrough)
```

## Repairs

1. `domainExtractor.ts` no longer derives resource/domain from route path or controller naming. It reads `route.identity.resourceName`, which is already produced by the route origin boundary.
2. `groupAggregator.ts` carries the exact bound FormRequest class from `route.binding.formRequests` into the route-derived RequestType.
3. `requestSourceMerger.ts` now joins FormRequest facts by exact `requestClass`, rather than by an independently inferred resource name.
4. The route-derived `RequestIdentity` remains authoritative during merge. FormRequest scanning enriches fields/actions instead of replacing the route identity.
5. An unbound FormRequest no longer creates an additional inferred RequestType in the manifest merge.
6. `routeManifestDescriptor.ts` remains a pure passthrough: it does not derive request or semantic types.

## Remaining upstream issue

`FormRequestScanner.ts` still contains legacy naming heuristics (`Store*`, `Update*`, `Create*`) to construct its temporary RequestType used by `ControllerScanner`. This is now outside the canonical manifest identity path, but should eventually be replaced by a dedicated FormRequest AST/source descriptor keyed only by the actual class name. Controller/route binding should remain the authoritative source for resource and action.

## Verification

`npx tsc --noEmit -p tsconfig.phase87.33.narrow.json`

Result: no new TypeScript errors. The only reported error remains the existing environment/dependency issue:

```text
packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.
```
