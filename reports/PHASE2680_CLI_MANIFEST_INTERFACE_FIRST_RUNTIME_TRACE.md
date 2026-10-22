# Phase 2680 — CLI Manifest Interface-First Runtime Trace

## Scope

Continue the upstream CLI/manifest audit by putting the interface-typed named-export example on the documented runtime integration path, improving the missing-capability diagnostic, and tracing source identity/inventory failures through scan/sync into manifest preflight and projection.

## Runtime trace

`ROUTESYNC_UPSTREAM_COMPOSITION_MODULE` → dynamic module import → named export `requestTypeDerivationSemanticComposition` → runtime shape guard → `composeRouteSyncCliUpstream` → injected pipeline consumed by `scan` / `sync` → source-project identity and source-document identity binding → source discovery and controller inventory ADT → complete source manifest → `routeManifestRequestResolutionPreflight.evaluate(completeManifest)` → exact preflight packet passed to projection → projected manifest or explicit blocked judgment.

The loader validates capability shape and canonical contract object identity; that alone cannot prove the semantic correctness of AST evidence, ADT closure, inventory completeness, semantic judgment, decision proof, authority, or integrity.

## Runtime example

`examples/upstream-composition/host-composition.template.ts` demonstrates the exact `export const requestTypeDerivationSemanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface` export consumed by the loader. The host's concrete capabilities are intentionally an implementation seam (`./productionCapabilities.js`), not fabricated repository implementations. The README explains compilation and `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE` configuration.

## Correction

The CLI's missing-composition diagnostic now explicitly lists executable preparation and authority decision-rule coverage and points to the host template. This aligns the error with the loader's actual required capabilities.

## Validation and limits

The Phase 2680 audit checks source-level runtime wiring and is not a substitute for TypeScript compilation or execution of a real host composition. Full semantic production remains blocked by the diagnostic composition's typed producer gaps at decision, authority and integrity. Do not claim production-complete `scan`/`sync` until host implementations are supplied and independently tested.


## Source-level root-cause assessment

The interface annotation is not confined to examples: the in-repository diagnostic composition also declares
`export const requestTypeDerivationSemanticComposition: RequestTypeDerivationSemanticPipelineCompositionInterface`.
The standalone loader dynamically imports the configured module, resolves that exact named export, then validates the canonical contract identity and executable capabilities before the CLI exposes commands. `scan` and `sync` both consume the injected pipeline and preflight the complete manifest before projection.

The important remaining distinction is **typed wiring versus production semantics**. TypeScript's interface annotation checks the compile-time shape; the loader's runtime guard checks selected shape/identity/capability conditions. Neither can prove that the host's AST/ADT evidence, inventory, reasoning, decision proof, authority judgment, and integrity witnesses are semantically sound. The host template's `./productionCapabilities.js` is deliberately absent, so the example is not independently runnable.

## Recommendations / closure criteria

1. Keep the named-export interface annotation on both the in-repository diagnostic composition and the host-owned runtime module; do not satisfy this requirement with an example-only declaration.
2. Keep the CLI fail-closed when the configured module/export or any mandatory capability is absent or malformed. Do not fall back to the diagnostic composition.
3. Implement and test real host producers for decision, authority, and integrity; currently those stages deliberately throw typed producer-gap errors.
4. Add integration coverage that compiles a real host bundle and runs both `scan` and `sync` against source fixtures, including malformed composition, source identity mismatch, incomplete inventory, blocked preflight, and successful projection.
5. Treat the audit scripts as source-structure checks, not as evidence of successful TypeScript compilation, package build, or end-to-end execution.

## Additional Phase 2680 audit hardening

The Phase 2680 audit now explicitly checks the interface-typed named export in the actual in-repository runtime composition and checks that the loader performs dynamic import plus lookup of the canonical named export. This closes the audit blind spot where the host template could pass while the runtime declaration itself was not checked.
