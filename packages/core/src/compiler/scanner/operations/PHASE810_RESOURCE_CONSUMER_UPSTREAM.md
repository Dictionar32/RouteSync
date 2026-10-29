# Phase 810 — Resource consumer upstream frontier

## Trace

The local build frontier after Phase 809 reached `ResourceScanner.ts` DTS only. ESM/CJS bundles succeeded; the remaining failures were all semantic-interface leaks in the resource consumer.

## Diagnostic frontier → model correction

1. `Presence<ControllerResourceDataflow | undefined>` was produced by wrapping an optional host parameter. The consumer now accepts canonical `Presence<ControllerResourceDataflow>` directly.
2. `PhpAstValue.resource_single/resource_collection` was accessed through an inference path that widened the ADT. The consumer now uses explicit `relationVariantFold` instantiations over the complete upstream `PhpAstValue` algebra and its remainder.
3. `OriginModelSymbol.identity.name` was stale vocabulary. The canonical model symbol exposes `name` directly; the consumer now consumes `value.name`.
4. `PhpArrayEntry.key` was accessed before the entry ADT was narrowed. `requireStringArrayKey` now folds the `keyed` entry variant first, then the upstream key variant.
5. Resource resolution construction now goes through `createResourceModelResolutionFact` rather than reconstructing the fact shape at the consumer.

## Architectural result

`ResourceScanner` is now a consumer of upstream semantic ADTs/fact factories rather than a producer of parallel local semantic shapes. The resource relation edges and model-resolution facts remain relation data, and variant dispatch is performed by the relational kernel.

This follows the same separation emphasized by CodeQL's distinction between syntax and data-flow graphs, while taking the semantic relation/fixed-point boundary into the RouteSync upstream model. citeturn0search1turn0search7

MLIR's dialect conversion/transform architecture similarly separates a transformation target from rewrite mechanisms; RouteSync's corresponding boundary is upstream Laravel semantic ADT → relation facts → solver/data-flow closure → target projection. citeturn0search0turn0search12

## Validation

- Focused TypeScript graph: no `ResourceScanner.ts` diagnostics; sandbox project compilation is blocked only by missing `@types/node` and `vitest/globals` in the stripped checkpoint environment.
- Phase audit: `audit-phase810-resource-consumer-upstream.cjs` must return `allPass: true`.
- Full `npm run build` must be rerun in the user's complete local workspace; this checkpoint does not claim a full build pass.

## Next frontier

After this consumer is applied, rerun `npm run build` and use the first remaining DTS diagnostic as the next semantic frontier. Priority remains resolver graph → AST/upstream mapping → analysis/data-flow → semantic type lowering, with the error diagnostic driving the next interface elevation rather than adding a local compatibility wrapper.
